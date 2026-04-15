import { NextResponse } from "next/server";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

// GET - List all members
export async function GET() {
  try {
    const supabase = getBookingServerClient();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a member
export async function PUT(request: Request) {
  try {
    const { id, name, email, phone, active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    const supabase = getBookingServerClient();
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (active !== undefined) updates.active = active;

    const { error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a member
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    const supabase = getBookingServerClient();
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
