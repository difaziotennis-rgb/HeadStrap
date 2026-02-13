import prisma from "../lib/prisma";

/**
 * Payment Service — Stripe Connect integration stub.
 *
 * All functions are ready to wire up to real Stripe API calls.
 * Replace the TODO sections with actual Stripe SDK calls when ready.
 */
export const paymentService = {
  /**
   * Create a Stripe Connect Express account for a user.
   *
   * In production, call your backend which runs:
   *   const account = await stripe.accounts.create({ type: 'express', email, ... });
   *   const link = await stripe.accountLinks.create({ account: account.id, type: 'account_onboarding', ... });
   *   return link.url;
   */
  async createConnectAccount(userId: string): Promise<{ onboardingUrl: string; accountId: string }> {
    // TODO: Replace with real Stripe API call
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const account = await stripe.accounts.create({ type: 'express' });
    // const link = await stripe.accountLinks.create({
    //   account: account.id,
    //   type: 'account_onboarding',
    //   refresh_url: `${process.env.APP_URL}/settings`,
    //   return_url: `${process.env.APP_URL}/settings?stripe=connected`,
    // });

    const mockAccountId = `acct_mock_${Date.now()}`;

    await prisma.user.update({
      where: { id: userId },
      data: { stripeConnectId: mockAccountId, payoutMethod: "stripe" },
    });

    return {
      onboardingUrl: `https://connect.stripe.com/setup/mock/${mockAccountId}`,
      accountId: mockAccountId,
    };
  },

  /**
   * Process a payout to a user's connected Stripe account.
   *
   * In production:
   *   const transfer = await stripe.transfers.create({
   *     amount: Math.round(amount * 100),
   *     currency: 'usd',
   *     destination: stripeConnectId,
   *   });
   */
  async processPayout(payoutId: string): Promise<{ success: boolean; transferId?: string; error?: string }> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { user: true },
    });

    if (!payout) return { success: false, error: "Payout not found" };
    if (payout.status !== "pending") return { success: false, error: `Payout is ${payout.status}, not pending` };

    const user = payout.user;
    if (!user.stripeConnectId) return { success: false, error: "User has no Stripe Connect account" };

    // TODO: Replace with real Stripe transfer
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(payout.amount * 100),
    //   currency: 'usd',
    //   destination: user.stripeConnectId,
    //   metadata: { payoutId: payout.id },
    // });

    const mockTransferId = `tr_mock_${Date.now()}`;

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "completed",
        completedAt: new Date(),
        stripeTransferId: mockTransferId,
      },
    });

    // Mark related sessions as paid_out
    const userSessions = await prisma.session.findMany({
      where: { userId: user.id, dataSaleStatus: "sold" },
    });
    if (userSessions.length > 0) {
      await prisma.session.updateMany({
        where: { userId: user.id, dataSaleStatus: "sold" },
        data: { dataSaleStatus: "paid_out" },
      });
    }

    return { success: true, transferId: mockTransferId };
  },
};
