import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getSession } from "@/lib/auth"

let prisma: PrismaClient

try {
  prisma = new PrismaClient()
} catch (error) {
  console.error("Failed to initialize Prisma Client:", error)
  // Create a mock client that will throw helpful errors
  prisma = {} as PrismaClient
}

/**
 * GET /api/reservations
 * Get reservations with optional date filter
 */
export async function GET(request: NextRequest) {
  try {
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "Database not configured. Please set DATABASE_URL in your .env file.",
          hint: "See DATABASE_SETUP.md for instructions",
        },
        { status: 500 }
      )
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") // YYYY-MM-DD format
    const resourceType = searchParams.get("resourceType") || "TENNIS_COURT"

    const where: any = {
      resourceType,
    }

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      where.startTime = {
        gte: startDate,
        lte: endDate,
      }
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
      orderBy: {
        startTime: "asc",
      },
    })

    // Transform to include memberName and reservationType
    const formattedReservations = reservations.map((res) => ({
      id: res.id,
      startTime: res.startTime,
      endTime: res.endTime,
      resourceType: res.resourceType,
      resourceId: res.resourceId,
      memberId: res.memberId,
      memberName: `${res.member.firstName} ${res.member.lastName}`,
      reservationType: (res as any).reservationType || "Singles", // Default if not in schema yet
      guests: res.guests,
      fee: res.fee,
      chargeToHouseAccount: (res as any).chargeToHouseAccount || false,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      reservations: formattedReservations,
    })
  } catch (error: any) {
    console.error("Error fetching reservations:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch reservations" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reservations
 * Create a new reservation
 */
export async function POST(request: NextRequest) {
  try {
    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "Database not configured. Please set DATABASE_URL in your .env file.",
          hint: "See DATABASE_SETUP.md for instructions",
        },
        { status: 500 }
      )
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      startTime,
      endTime,
      resourceType = "TENNIS_COURT",
      resourceId,
      memberId,
      memberName,
      reservationType = "Singles",
      guests = 0,
      fee = 0,
      chargeToHouseAccount = false,
    } = body

    // Validation
    if (!startTime || !endTime || !resourceId || !memberId) {
      return NextResponse.json(
        { error: "Missing required fields: startTime, endTime, resourceId, memberId" },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      )
    }

    // Check for overlapping reservations
    const overlapping = await prisma.reservation.findFirst({
      where: {
        resourceId,
        resourceType,
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
          conflict: {
            id: overlapping.id,
            startTime: overlapping.startTime,
            endTime: overlapping.endTime,
          },
        },
        { status: 409 }
      )
    }

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        startTime: start,
        endTime: end,
        resourceType,
        resourceId,
        memberId,
        guests,
        fee,
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

    // If charge to house account, create a transaction
    if (chargeToHouseAccount && fee > 0) {
      await prisma.transaction.create({
        data: {
          memberId,
          amount: fee,
          department: "COURT_RENTAL",
          description: `Court Reservation - ${resourceId} - ${reservationType}`,
          isPosted: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      reservation: {
        ...reservation,
        memberName: `${reservation.member.firstName} ${reservation.member.lastName}`,
        reservationType,
        chargeToHouseAccount,
      },
    })
  } catch (error: any) {
    console.error("Error creating reservation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create reservation" },
      { status: 500 }
    )
  }
}

