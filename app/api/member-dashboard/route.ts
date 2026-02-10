import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

export async function POST(request: Request) {
  try {
    const { memberCode } = await request.json();

    if (!memberCode) {
      return NextResponse.json({ error: "Member code required" }, { status: 400 });
    }

    const supabase = getBookingServerClient();

    // Get member info
    const { data: member, error: memberErr } = await supabase
      .from("members")
      .select("*")
      .eq("member_code", memberCode.trim())
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (!member.active) {
      return NextResponse.json({ error: "Membership is inactive" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get upcoming lessons
    const { data: upcoming } = await supabase
      .from("bookings")
      .select("id, date, hour, amount, status, payment_status")
      .eq("member_code", memberCode.trim())
      .gte("date", today)
      .eq("status", "confirmed")
      .order("date", { ascending: true })
      .order("hour", { ascending: true });

    // Get total paid amount
    const { data: paidBookings } = await supabase
      .from("bookings")
      .select("amount")
      .eq("member_code", memberCode.trim())
      .eq("payment_status", "paid");

    const totalPaid = (paidBookings || []).reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalLessons = (paidBookings || []).length;

    // Get card info from Stripe
    let cardInfo = null;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && member.stripe_customer_id) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        const paymentMethods = await stripe.paymentMethods.list({
          customer: member.stripe_customer_id,
          type: "card",
        });

        if (paymentMethods.data.length > 0) {
          const card = paymentMethods.data[0].card;
          cardInfo = {
            brand: card?.brand || "card",
            last4: card?.last4 || "****",
            expMonth: card?.exp_month,
            expYear: card?.exp_year,
          };
        }
      } catch (e) {
        console.error("Failed to fetch card info:", e);
      }
    }

    return NextResponse.json({
      member: {
        name: member.name,
        email: member.email,
        phone: member.phone,
        memberCode: member.member_code,
        joinedAt: member.created_at,
      },
      upcomingLessons: upcoming || [],
      payments: {
        totalPaid,
        totalLessons,
        card: cardInfo,
      },
    });
  } catch (error: any) {
    console.error("Member dashboard error:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard" }, { status: 500 });
  }
}
