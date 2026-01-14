import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * GET /api/bookings
 * Get all bookings (court and tee time)
 */
export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all" // "courts", "tee-times", "all"

    const where: any = {}
    if (type === "courts") {
      where.resourceType = "TENNIS_COURT"
    } else if (type === "tee-times") {
      where.resourceType = "TEE_TIME"
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            memberNumber: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    })

    const formatted = reservations.map((res) => ({
      id: res.id,
      memberName: `${res.member.firstName} ${res.member.lastName}`,
      memberNumber: `M-${res.member.memberNumber}`,
      resourceId: res.resourceId,
      resourceType: res.resourceType,
      startTime: res.startTime,
      endTime: res.endTime,
      guests: res.guests,
      status: "confirmed",
    }))

    return NextResponse.json({ success: true, bookings: formatted })
  } catch (error: any) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch bookings" }, { status: 500 })
  }
}


