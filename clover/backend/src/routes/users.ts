import { Router } from "express";
import prisma from "../lib/prisma";
import { ok, fail } from "../lib/response";
import { requireUser, AuthRequest } from "../middleware/auth";
import { getUserEarnings, calculateEstimatedEarnings, getSessionRates } from "../services/earnings";
import { dataService } from "../services/data";
import { paymentService } from "../services/payments";

const router = Router();

// All routes require JWT auth
router.use(requireUser);

// ─── Profile ───────────────────────────────────────

/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     tags: [User]
 *     summary: Get current user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User profile
 */
router.get("/profile", async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return fail(res, "User not found", 404);

    return ok(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      verified: user.verified,
      calibrated: user.calibrated,
      stripeConnectId: user.stripeConnectId,
      payoutMethod: user.payoutMethod,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/user/profile:
 *   put:
 *     tags: [User]
 *     summary: Update current user's profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               verified: { type: boolean }
 *               calibrated: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.put("/profile", async (req: AuthRequest, res) => {
  try {
    const { name, verified, calibrated } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (verified !== undefined) data.verified = verified;
    if (calibrated !== undefined) data.calibrated = calibrated;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    });

    return ok(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      verified: user.verified,
      calibrated: user.calibrated,
      stripeConnectId: user.stripeConnectId,
      payoutMethod: user.payoutMethod,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Sessions ──────────────────────────────────────

/**
 * @openapi
 * /api/user/sessions:
 *   get:
 *     tags: [User]
 *     summary: List user's sessions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get("/sessions", async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId },
      orderBy: { startTime: "desc" },
    });
    return ok(res, sessions);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/user/sessions/start:
 *   post:
 *     tags: [User]
 *     summary: Start a new recording session
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, default: "Field Recording" }
 *               narrationEnabled: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Session started
 */
router.post("/sessions/start", async (req: AuthRequest, res) => {
  try {
    const { type = "Field Recording", narrationEnabled = true } = req.body;

    const session = await prisma.session.create({
      data: {
        userId: req.userId!,
        type,
        narrationEnabled,
        status: "recording",
      },
    });

    return ok(res, session, 201);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/user/sessions/{id}:
 *   put:
 *     tags: [User]
 *     summary: Update an active session (duration, data, earnings)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               durationMinutes: { type: number }
 *     responses:
 *       200:
 *         description: Updated session
 */
router.put("/sessions/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { durationMinutes } = req.body;

    const session = await prisma.session.findFirst({
      where: { id, userId: req.userId },
    });
    if (!session) return fail(res, "Session not found", 404);

    const mins = +(durationMinutes || 0).toFixed(2);
    const dataSizeMB = +(mins * 45).toFixed(1); // MB_PER_MINUTE
    const estimatedEarnings = await calculateEstimatedEarnings(mins, session.narrationEnabled);

    const updated = await prisma.session.update({
      where: { id },
      data: { durationMinutes: mins, dataSizeMB, estimatedEarnings },
    });

    return ok(res, updated);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/user/sessions/{id}/end:
 *   post:
 *     tags: [User]
 *     summary: End a recording session
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session ended
 */
router.post("/sessions/:id/end", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findFirst({
      where: { id, userId: req.userId },
    });
    if (!session) return fail(res, "Session not found", 404);

    const updated = await prisma.session.update({
      where: { id },
      data: {
        endTime: new Date(),
        status: "completed",
        dataSaleStatus: "pending_upload",
      },
    });

    // Queue for cloud upload in background
    dataService.queueUpload(id).catch((e) => console.error("[Upload queue error]", e));

    return ok(res, updated);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Earnings ──────────────────────────────────────

/**
 * @openapi
 * /api/user/earnings:
 *   get:
 *     tags: [User]
 *     summary: Get earnings breakdown for current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Earnings summary
 */
router.get("/earnings", async (req: AuthRequest, res) => {
  try {
    const earnings = await getUserEarnings(req.userId!);
    return ok(res, earnings);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Payouts ───────────────────────────────────────

/**
 * @openapi
 * /api/user/payouts:
 *   get:
 *     tags: [User]
 *     summary: List user's payouts
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of payouts
 */
router.get("/payouts", async (req: AuthRequest, res) => {
  try {
    const payouts = await prisma.payout.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, payouts);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/user/payouts/request:
 *   post:
 *     tags: [User]
 *     summary: Request a payout of pending earnings
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *     responses:
 *       201:
 *         description: Payout requested
 */
router.post("/payouts/request", async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return fail(res, "Amount must be > 0");

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return fail(res, "User not found", 404);
    if (user.payoutMethod === "none" || !user.payoutMethod) {
      return fail(res, "Set up a payment method in Settings first");
    }

    const payout = await prisma.payout.create({
      data: {
        userId: req.userId!,
        amount: +amount.toFixed(2),
        method: (user.payoutMethod as "stripe" | "bank") || "stripe",
      },
    });

    return ok(res, payout, 201);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Payment Setup ─────────────────────────────────

/**
 * @openapi
 * /api/user/payments/connect:
 *   post:
 *     tags: [User]
 *     summary: Start Stripe Connect onboarding
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Onboarding URL
 */
router.post("/payments/connect", async (req: AuthRequest, res) => {
  try {
    const result = await paymentService.createConnectAccount(req.userId!);
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

export default router;
