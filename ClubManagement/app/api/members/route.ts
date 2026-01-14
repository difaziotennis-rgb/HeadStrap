import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * GET /api/members
 * Get all members with optional search
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
    const search = searchParams.get("search") || ""

    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
      const memberNum = parseInt(search)
      if (!isNaN(memberNum)) {
        where.OR.push({ memberNumber: memberNum })
      }
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: { memberNumber: "asc" },
    })

    return NextResponse.json({ success: true, members })
  } catch (error: any) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch members" }, { status: 500 })
  }
}

/**
 * POST /api/members
 * Create a new member
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
    const { firstName, lastName, email, phone, tier, status, houseAccountLimit } = body

    if (!firstName || !lastName || !email || !tier || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get next member number
    const lastMember = await prisma.member.findFirst({
      orderBy: { memberNumber: "desc" },
    })
    const nextMemberNumber = lastMember ? lastMember.memberNumber + 1 : 2024001

    // Check if email already exists
    const existing = await prisma.member.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        memberNumber: nextMemberNumber,
        tier,
        status,
        houseAccountLimit: houseAccountLimit ? parseFloat(houseAccountLimit) : 5000.00,
      },
    })

    return NextResponse.json({ success: true, member })
  } catch (error: any) {
    console.error("Error creating member:", error)
    return NextResponse.json({ error: error.message || "Failed to create member" }, { status: 500 })
  }
}


