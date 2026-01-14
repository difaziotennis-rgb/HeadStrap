import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getSession } from "@/lib/auth"

const prisma = new PrismaClient()

/**
 * GET /api/reservations/[id]
 * Get a single reservation by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
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
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      reservation: {
        ...reservation,
        memberName: `${reservation.member.firstName} ${reservation.member.lastName}`,
      },
    })
  } catch (error: any) {
    console.error("Error fetching reservation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch reservation" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/reservations/[id]
 * Update a reservation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      startTime,
      endTime,
      resourceId,
      memberId,
      guests,
      fee,
      chargeToHouseAccount,
    } = body

    // Check if reservation exists
    const existing = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (startTime !== undefined) updateData.startTime = new Date(startTime)
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    if (resourceId !== undefined) updateData.resourceId = resourceId
    if (memberId !== undefined) updateData.memberId = memberId
    if (guests !== undefined) updateData.guests = guests
    if (fee !== undefined) updateData.fee = fee

    // Check for overlapping reservations (excluding current one)
    if (startTime || endTime || resourceId) {
      const start = updateData.startTime || existing.startTime
      const end = updateData.endTime || existing.endTime
      const resource = updateData.resourceId || existing.resourceId

      const overlapping = await prisma.reservation.findFirst({
        where: {
          id: { not: id },
          resourceId: resource,
          resourceType: existing.resourceType,
          OR: [
            {
              startTime: { lt: end },
              endTime: { gt: start },
            },
          ],
        },
      })

      if (overlapping) {
        return NextResponse.json(
          {
            error: "This time slot overlaps with an existing reservation",
          },
          { status: 409 }
        )
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
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
      reservation: {
        ...reservation,
        memberName: `${reservation.member.firstName} ${reservation.member.lastName}`,
      },
    })
  } catch (error: any) {
    console.error("Error updating reservation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update reservation" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reservations/[id]
 * Delete a reservation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    await prisma.reservation.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Reservation deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting reservation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete reservation" },
      { status: 500 }
    )
  }
}


