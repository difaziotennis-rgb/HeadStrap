import { PrismaClient, MembershipTier } from "@prisma/client"

const prisma = new PrismaClient()

// Monthly dues by tier
const MONTHLY_DUES: Record<MembershipTier, number> = {
  FULL_GOLF: 500.0,
  TENNIS_SOCIAL: 250.0,
  JUNIOR: 150.0,
  HONORARY: 0.0,
}

/**
 * Processes monthly billing for all active members
 * - Gathers all unposted transactions
 * - Adds monthly dues based on membership tier
 * - Creates a new statement
 * - Marks transactions as posted
 */
export async function processMonthlyBilling(billingPeriod: Date = new Date()) {
  try {
    // Get the first day of the billing period (typically the 1st of the month)
    const periodStart = new Date(billingPeriod)
    periodStart.setDate(1)
    periodStart.setHours(0, 0, 0, 0)

    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    periodEnd.setDate(0) // Last day of the billing period month
    periodEnd.setHours(23, 59, 59, 999)

    // Get all active members
    const activeMembers = await prisma.member.findMany({
      where: {
        status: "ACTIVE",
      },
    })

    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const member of activeMembers) {
      try {
        // Get all unposted transactions for this member
        const unpostedTransactions = await prisma.transaction.findMany({
          where: {
            memberId: member.id,
            isPosted: false,
          },
        })

        // Calculate total from transactions
        const transactionTotal = unpostedTransactions.reduce(
          (sum, txn) => sum + parseFloat(txn.amount.toString()),
          0
        )

        // Get monthly dues for this member's tier
        const monthlyDues = MONTHLY_DUES[member.tier]

        // Calculate total statement amount
        const totalAmount = transactionTotal + monthlyDues

        // Only create statement if there are transactions or dues
        if (unpostedTransactions.length > 0 || monthlyDues > 0) {
          // Create the statement
          const statement = await prisma.statement.create({
            data: {
              memberId: member.id,
              billingPeriod: periodStart,
              totalAmount: totalAmount,
              isPaid: false,
            },
          })

          // Mark all transactions as posted
          if (unpostedTransactions.length > 0) {
            await prisma.transaction.updateMany({
              where: {
                id: {
                  in: unpostedTransactions.map((t) => t.id),
                },
              },
              data: {
                isPosted: true,
              },
            })
          }

          // If there are monthly dues, create a transaction for them
          if (monthlyDues > 0) {
            await prisma.transaction.create({
              data: {
                memberId: member.id,
                amount: monthlyDues,
                department: "MEMBERSHIP",
                description: `Monthly Dues - ${member.tier}`,
                isPosted: true, // Already included in statement
              },
            })
          }

          results.processed++
        } else {
          results.skipped++
        }
      } catch (error: any) {
        results.errors.push(`Member ${member.memberNumber} (${member.firstName} ${member.lastName}): ${error.message}`)
        console.error(`Error processing billing for member ${member.id}:`, error)
      }
    }

    return results
  } catch (error) {
    console.error("Error in processMonthlyBilling:", error)
    throw error
  }
}

/**
 * Get monthly dues amount for a membership tier
 */
export function getMonthlyDues(tier: MembershipTier): number {
  return MONTHLY_DUES[tier]
}


