import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

export async function POST(request: Request) {
  try {
    const { memberCode } = await request.json();

    if (!memberCode) {
      return NextResponse.json({ error: "Member code required" }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Payment system not configured" }, { status: 500 });
    }

    const supabase = getBookingServerClient();

    // Look up the member
    const { data: member, error: memberErr } = await supabase
      .from("members")
      .select("*")
      .eq("member_code", memberCode.trim())
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Create a Checkout Session in "setup" mode to update card
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: member.stripe_customer_id,
      payment_method_types: ["card"],
      success_url: `${baseUrl}/member?card_updated=true`,
      cancel_url: `${baseUrl}/member?card_cancelled=true`,
      metadata: {
        type: "card-update",
        memberId: member.id,
        memberCode: member.member_code,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error: any) {
    console.error("Error creating card update session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start card update" },
      { status: 500 }
    );
  }
}
