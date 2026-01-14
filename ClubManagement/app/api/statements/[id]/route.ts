import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * GET /api/statements/[id]
 * Get a single statement with transactions
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

    const statement = await prisma.statement.findUnique({
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

    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 })
    }

    // Get transactions for this statement period
    const transactions = await prisma.transaction.findMany({
      where: {
        memberId: statement.memberId,
        isPosted: true,
        createdAt: {
          lte: statement.billingPeriod,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      statement: {
        ...statement,
        transactions: transactions.map((t) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.createdAt,
        })),
      },
    })
  } catch (error: any) {
    console.error("Error fetching statement:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch statement" }, { status: 500 })
  }
}


