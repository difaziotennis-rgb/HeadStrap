import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getSession } from "@/lib/auth"

let prisma: PrismaClient

try {
  prisma = new PrismaClient()
} catch (error) {
  console.error("Failed to initialize Prisma Client:", error)
  prisma = {} as PrismaClient
}

/**
 * POST /api/pos/settle
 * Settle a POS transaction to a member's house account
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "Database not configured",
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
      items,
      memberId,
      gratuity = 0,
      discount = 0,
      paymentMethod = "house_account",
    } = body

    if (!memberId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: memberId, items" },
        { status: 400 }
      )
    }

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Calculate total
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.item.price * item.quantity,
      0
    )
    const subtotalAfterDiscount = subtotal - discount
    const tax = subtotalAfterDiscount * 0.08
    const total = subtotalAfterDiscount + gratuity + tax

    // Check house account limit
    // Note: We'd need to calculate current balance from transactions
    // For now, we'll create the transaction and let the billing system handle limits

    // Create transaction for the sale
    const description = items
      .map((item: any) => `${item.quantity}x ${item.item.name}`)
      .join(", ")

    const transaction = await prisma.transaction.create({
      data: {
        memberId,
        amount: total,
        department: items[0]?.item?.category === "Food" || items[0]?.item?.category === "Beverage"
          ? "F&B"
          : "PRO_SHOP",
        description: `POS Sale: ${description}${gratuity > 0 ? ` (Service: ${formatCurrency(gratuity)})` : ""}${discount > 0 ? ` (Discount: -${formatCurrency(discount)})` : ""}`,
        isPosted: false,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        member: {
          name: `${transaction.member.firstName} ${transaction.member.lastName}`,
          memberNumber: transaction.member.memberNumber,
        },
      },
      message: "Transaction settled successfully",
    })
  } catch (error: any) {
    console.error("Error settling transaction:", error)
    return NextResponse.json(
      { error: error.message || "Failed to settle transaction" },
      { status: 500 }
    )
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}


