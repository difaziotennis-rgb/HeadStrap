import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * GET /api/members/[id]
 * Get a single member
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

    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: {
        reservations: {
          take: 10,
          orderBy: { startTime: "desc" },
        },
        statements: {
          take: 5,
          orderBy: { billingPeriod: "desc" },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, member })
  } catch (error: any) {
    console.error("Error fetching member:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch member" }, { status: 500 })
  }
}

/**
 * PUT /api/members/[id]
 * Update a member
 */
export async function PUT(
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

    const body = await request.json()
    const { firstName, lastName, email, phone, tier, status, houseAccountLimit } = body

    // Check if member exists
    const existing = await prisma.member.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Check if email is being changed and if it conflicts
    if (email && email !== existing.email) {
      const emailExists = await prisma.member.findUnique({
        where: { email },
      })
      if (emailExists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
    }

    const updateData: any = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (email) updateData.email = email
    if (tier) updateData.tier = tier
    if (status) updateData.status = status
    if (houseAccountLimit !== undefined) updateData.houseAccountLimit = parseFloat(houseAccountLimit)

    const member = await prisma.member.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, member })
  } catch (error: any) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: error.message || "Failed to update member" }, { status: 500 })
  }
}

/**
 * DELETE /api/members/[id]
 * Delete a member
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

    const member = await prisma.member.findUnique({
      where: { id: params.id },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    await prisma.member.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: "Member deleted" })
  } catch (error: any) {
    console.error("Error deleting member:", error)
    return NextResponse.json({ error: error.message || "Failed to delete member" }, { status: 500 })
  }
}


