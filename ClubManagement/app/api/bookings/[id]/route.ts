import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * GET /api/bookings/[id]
 * Get a single booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
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
    })

    if (!reservation) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...reservation,
        memberName: `${reservation.member.firstName} ${reservation.member.lastName}`,
        memberNumber: `M-${reservation.member.memberNumber}`,
      },
    })
  } catch (error: any) {
    console.error("Error fetching booking:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch booking" }, { status: 500 })
  }
}

/**
 * DELETE /api/bookings/[id]
 * Cancel a booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    await prisma.reservation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: "Booking cancelled" })
  } catch (error: any) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ error: error.message || "Failed to cancel booking" }, { status: 500 })
  }
}


