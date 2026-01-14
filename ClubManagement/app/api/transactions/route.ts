import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * POST /api/transactions
 * Create a transaction (charge to house account)
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
    const { memberNumber, amount, description, category } = body

    if (!memberNumber || !amount || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find member by member number
    const memberNum = parseInt(memberNumber.replace("M-", "").replace("2024-", ""))
    const member = await prisma.member.findFirst({
      where: { memberNumber: memberNum },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        memberId: member.id,
        amount: Math.abs(parseFloat(amount)), // Positive for charge
        department: category || "POS_PURCHASE",
        description,
        isPosted: false,
      },
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        amount: parseFloat(amount),
        description,
        category: category || "POS_PURCHASE",
        date: transaction.createdAt,
      },
    })
  } catch (error: any) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: error.message || "Failed to create transaction" }, { status: 500 })
  }
}


