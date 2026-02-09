import { NextResponse } from "next/server";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

export async function POST(request: Request) {
  try {
    const { memberCode } = await request.json();

    if (!memberCode) {
      return NextResponse.json(
        { error: "Member code is required" },
        { status: 400 }
      );
    }

    const supabase = getBookingServerClient();

    const { data: member, error } = await supabase
      .from("members")
      .select("id, member_code, name, email, phone, active")
      .eq("member_code", memberCode.toUpperCase().trim())
      .single();

    if (error || !member) {
      return NextResponse.json(
        { valid: false, error: "Member code not found" },
        { status: 404 }
      );
    }

    if (!member.active) {
      return NextResponse.json(
        { valid: false, error: "This membership is no longer active" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone || "",
      },
    });
  } catch (error: any) {
    console.error("Error validating member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate member" },
      { status: 500 }
    );
  }
}
