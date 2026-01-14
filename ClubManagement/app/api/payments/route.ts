import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * POST /api/payments
 * Process a payment
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
    const { memberNumber, amount, method, referenceNumber } = body

    if (!memberNumber || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find member by member number
    const member = await prisma.member.findFirst({
      where: {
        memberNumber: parseInt(memberNumber.replace("M-", "").replace("2024-", "")),
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Create a negative transaction (payment reduces balance)
    const transaction = await prisma.transaction.create({
      data: {
        memberId: member.id,
        amount: -Math.abs(parseFloat(amount)), // Negative for payment
        department: "PAYMENT",
        description: `Payment via ${method}${referenceNumber ? ` - ${referenceNumber}` : ""}`,
        isPosted: false,
      },
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: transaction.id,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        amount: parseFloat(amount),
        method,
        referenceNumber,
        processedAt: transaction.createdAt,
      },
    })
  } catch (error: any) {
    console.error("Error processing payment:", error)
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 })
  }
}


