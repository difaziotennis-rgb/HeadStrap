import Stripe from "stripe";
import prisma from "../lib/prisma";

// ─── Stripe Client ──────────────────────────────────
// Uses real Stripe when STRIPE_SECRET_KEY is set, otherwise falls back to mock mode.

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const MOCK_MODE = !STRIPE_KEY;

let stripe: Stripe | null = null;
if (STRIPE_KEY) {
  stripe = new Stripe(STRIPE_KEY, { apiVersion: "2025-01-27.acacia" as any });
  console.log("[Stripe] Live mode enabled");
} else {
  console.log("[Stripe] No STRIPE_SECRET_KEY — running in mock mode");
}

// Frontend return URL after Stripe onboarding
const APP_URL = process.env.APP_URL || "http://localhost:8081";

/**
 * Payment Service — Stripe Connect integration.
 * Real Stripe when configured, graceful mock when not.
 */
export const paymentService = {
  /** Whether we're using real Stripe or mock mode */
  isLive: !MOCK_MODE,

  /**
   * Create a Stripe Connect Express account for a user and return the onboarding link.
   */
  async createConnectAccount(
    userId: string
  ): Promise<{ onboardingUrl: string; accountId: string; mock: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // If already connected, return a refresh link
    if (user.stripeConnectId && stripe) {
      const link = await stripe.accountLinks.create({
        account: user.stripeConnectId,
        type: "account_onboarding",
        refresh_url: `${APP_URL}/settings?stripe=refresh`,
        return_url: `${APP_URL}/settings?stripe=connected`,
      });
      return { onboardingUrl: link.url, accountId: user.stripeConnectId, mock: false };
    }

    if (stripe) {
      // ── Real Stripe ──
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { cloverUserId: userId },
        capabilities: {
          transfers: { requested: true },
        },
      });

      const link = await stripe.accountLinks.create({
        account: account.id,
        type: "account_onboarding",
        refresh_url: `${APP_URL}/settings?stripe=refresh`,
        return_url: `${APP_URL}/settings?stripe=connected`,
      });

      await prisma.user.update({
        where: { id: userId },
        data: { stripeConnectId: account.id, payoutMethod: "stripe" },
      });

      return { onboardingUrl: link.url, accountId: account.id, mock: false };
    }

    // ── Mock Mode ──
    const mockAccountId = `acct_mock_${Date.now()}`;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeConnectId: mockAccountId, payoutMethod: "stripe" },
    });

    return {
      onboardingUrl: `https://connect.stripe.com/setup/mock/${mockAccountId}`,
      accountId: mockAccountId,
      mock: true,
    };
  },

  /**
   * Check if a user's Connect account is fully onboarded and charges-enabled.
   */
  async checkAccountStatus(
    stripeConnectId: string
  ): Promise<{ ready: boolean; details_submitted: boolean; payouts_enabled: boolean }> {
    if (!stripe || stripeConnectId.startsWith("acct_mock_")) {
      return { ready: true, details_submitted: true, payouts_enabled: true };
    }

    const account = await stripe.accounts.retrieve(stripeConnectId);
    return {
      ready: account.details_submitted === true && account.payouts_enabled === true,
      details_submitted: account.details_submitted === true,
      payouts_enabled: account.payouts_enabled === true,
    };
  },

  /**
   * Process a payout — create a real Stripe Transfer to the user's Connect account.
   */
  async processPayout(
    payoutId: string
  ): Promise<{ success: boolean; transferId?: string; error?: string; mock: boolean }> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { user: true },
    });

    if (!payout) return { success: false, error: "Payout not found", mock: MOCK_MODE };
    if (payout.status !== "pending")
      return { success: false, error: `Payout is ${payout.status}, not pending`, mock: MOCK_MODE };

    const user = payout.user;
    if (!user.stripeConnectId)
      return { success: false, error: "User has no Stripe Connect account", mock: MOCK_MODE };

    // Mark as processing first
    await prisma.payout.update({
      where: { id: payoutId },
      data: { status: "processing" },
    });

    let transferId: string;

    if (stripe && !user.stripeConnectId.startsWith("acct_mock_")) {
      // ── Real Stripe Transfer ──
      try {
        // Check account is ready to receive payouts
        const status = await this.checkAccountStatus(user.stripeConnectId);
        if (!status.payouts_enabled) {
          await prisma.payout.update({
            where: { id: payoutId },
            data: { status: "pending" }, // revert back
          });
          return {
            success: false,
            error: "User's Stripe account is not fully set up for payouts. They need to complete onboarding.",
            mock: false,
          };
        }

        const transfer = await stripe.transfers.create({
          amount: Math.round(payout.amount * 100), // cents
          currency: "usd",
          destination: user.stripeConnectId,
          metadata: { payoutId: payout.id, userId: user.id },
        });

        transferId = transfer.id;
      } catch (stripeErr: any) {
        await prisma.payout.update({
          where: { id: payoutId },
          data: { status: "failed" },
        });
        return {
          success: false,
          error: `Stripe error: ${stripeErr.message}`,
          mock: false,
        };
      }
    } else {
      // ── Mock Transfer ──
      transferId = `tr_mock_${Date.now()}`;
    }

    // Mark payout as completed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "completed",
        completedAt: new Date(),
        stripeTransferId: transferId,
      },
    });

    // Mark related sessions as paid_out
    await prisma.session.updateMany({
      where: { userId: user.id, dataSaleStatus: "sold" },
      data: { dataSaleStatus: "paid_out" },
    });

    return { success: true, transferId, mock: MOCK_MODE };
  },

  /**
   * Create a Stripe login link so a user can manage their Express dashboard.
   */
  async createDashboardLink(stripeConnectId: string): Promise<string | null> {
    if (!stripe || stripeConnectId.startsWith("acct_mock_")) {
      return null;
    }
    const link = await stripe.accounts.createLoginLink(stripeConnectId);
    return link.url;
  },
};
