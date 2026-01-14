import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * POST /api/tee-times
 * Create a tee time booking
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { memberNumber, teeNumber, time, players, guestNames, cartRental } = body

    if (!memberNumber || !teeNumber || !time || !players) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find member
    const memberNum = parseInt(memberNumber.replace("M-", "").replace("2024-", ""))
    const member = await prisma.member.findFirst({
      where: { memberNumber: memberNum },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const startTime = new Date(time)
    const endTime = new Date(startTime)
    endTime.setHours(endTime.getHours() + 4) // 4 hour tee time slot

    // Check for conflicts
    const overlapping = await prisma.reservation.findFirst({
      where: {
        resourceType: "TEE_TIME",
        resourceId: `Tee ${teeNumber}`,
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json({ error: "Tee time slot is already booked" }, { status: 409 })
    }

    const reservation = await prisma.reservation.create({
      data: {
        startTime,
        endTime,
        resourceType: "TEE_TIME",
        resourceId: `Tee ${teeNumber}`,
        memberId: member.id,
        guests: parseInt(players) - 1, // Subtract member from guest count
        fee: cartRental ? 50 : 0, // Cart rental fee
      },
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

    return NextResponse.json({
      success: true,
      booking: {
        ...reservation,
        memberName: `${reservation.member.firstName} ${reservation.member.lastName}`,
        memberNumber: `M-${reservation.member.memberNumber}`,
        teeNumber: parseInt(teeNumber),
        players: parseInt(players),
        cartRental: cartRental || false,
      },
    })
  } catch (error: any) {
    console.error("Error creating tee time:", error)
    return NextResponse.json({ error: error.message || "Failed to create tee time" }, { status: 500 })
  }
}


