import { NextResponse } from "next/server";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

type Body = {
  memberCode?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const memberCode = String(body.memberCode || "").trim();

    if (!memberCode) {
      return NextResponse.json({ valid: false, error: "Member code is required." }, { status: 400 });
    }

    const supabase = getBookingServerClient();
    const { data, error } = await supabase
      .from("members")
      .select("id,name,email,phone,member_code,active")
      .eq("member_code", memberCode)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ valid: false, error: "Could not validate member code." }, { status: 500 });
    }

    if (!data || data.active === false) {
      return NextResponse.json({ valid: false, error: "Invalid member code" });
    }

    return NextResponse.json({
      valid: true,
      member: {
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        memberCode: data.member_code,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: "Failed to validate member code.", details: String(error) },
      { status: 500 }
    );
  }
}

