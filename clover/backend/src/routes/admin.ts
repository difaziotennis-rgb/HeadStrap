import { Router } from "express";
import prisma from "../lib/prisma";
import { ok, fail, paginated } from "../lib/response";
import { requireAdmin } from "../middleware/auth";
import { getUserEarnings, getRates } from "../services/earnings";
import { dataService } from "../services/data";
import { paymentService } from "../services/payments";

const router = Router();

// All routes require API key
router.use(requireAdmin);

// ─── Dashboard ─────────────────────────────────────

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform-wide metrics overview
 *     security: [{ apiKeyAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
router.get("/dashboard", async (_req, res) => {
  try {
    const [
      totalUsers,
      totalSessions,
      sessionAgg,
      pendingUpload,
      uploaded,
      sold,
      paidOut,
      totalPayouts,
      completedPayouts,
      pendingPayouts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.session.count({ where: { status: "completed" } }),
      prisma.session.aggregate({
        where: { status: "completed" },
        _sum: {
          dataSizeMB: true,
          durationMinutes: true,
          estimatedEarnings: true,
          actualEarnings: true,
          userPayout: true,
          platformRevenue: true,
        },
      }),
      prisma.session.count({ where: { dataSaleStatus: "pending_upload" } }),
      prisma.session.count({ where: { dataSaleStatus: "uploaded" } }),
      prisma.session.count({ where: { dataSaleStatus: "sold" } }),
      prisma.session.count({ where: { dataSaleStatus: "paid_out" } }),
      prisma.payout.count(),
      prisma.payout.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
      prisma.payout.aggregate({ where: { status: "pending" }, _sum: { amount: true } }),
    ]);

    const sums = sessionAgg._sum;

    return ok(res, {
      users: {
        total: totalUsers,
      },
      sessions: {
        total: totalSessions,
        pendingUpload,
        uploaded,
        sold,
        paidOut,
      },
      data: {
        totalMB: +(sums.dataSizeMB || 0).toFixed(1),
        totalGB: +((sums.dataSizeMB || 0) / 1024).toFixed(2),
        totalHours: +((sums.durationMinutes || 0) / 60).toFixed(1),
      },
      revenue: {
        totalEstimated: +(sums.estimatedEarnings || 0).toFixed(2),
        totalActualSales: +(sums.actualEarnings || 0).toFixed(2),
        totalUserPayouts: +(sums.userPayout || 0).toFixed(2),
        totalPlatformRevenue: +(sums.platformRevenue || 0).toFixed(2),
      },
      payouts: {
        total: totalPayouts,
        completedAmount: +(completedPayouts._sum.amount || 0).toFixed(2),
        pendingAmount: +(pendingPayouts._sum.amount || 0).toFixed(2),
      },
    });
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Users ─────────────────────────────────────────

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users with pagination and search
 *     security: [{ apiKeyAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          verified: true,
          calibrated: true,
          stripeConnectId: true,
          payoutMethod: true,
          createdAt: true,
          _count: { select: { sessions: true, payouts: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginated(res, users, total, page, limit);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get full detail for a single user including sessions and earnings
 *     security: [{ apiKeyAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User detail with earnings
 */
router.get("/users/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        sessions: { orderBy: { startTime: "desc" } },
        payouts: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!user) return fail(res, "User not found", 404);

    const earnings = await getUserEarnings(user.id);

    return ok(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
        calibrated: user.calibrated,
        stripeConnectId: user.stripeConnectId,
        payoutMethod: user.payoutMethod,
        createdAt: user.createdAt.toISOString(),
      },
      earnings,
      payouts: user.payouts,
    });
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Sessions / Data ───────────────────────────────

/**
 * @openapi
 * /api/admin/sessions:
 *   get:
 *     tags: [Admin]
 *     summary: List all sessions with filters
 *     security: [{ apiKeyAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by dataSaleStatus (pending_upload, uploaded, listed, sold, paid_out)
 *       - in: query
 *         name: narrated
 *         schema: { type: boolean }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: after
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: before
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated session list
 */
router.get("/sessions", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const where: any = {};
    if (req.query.status) where.dataSaleStatus = req.query.status;
    if (req.query.narrated !== undefined) where.narrationEnabled = req.query.narrated === "true";
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.after || req.query.before) {
      where.startTime = {};
      if (req.query.after) where.startTime.gte = new Date(req.query.after as string);
      if (req.query.before) where.startTime.lte = new Date(req.query.before as string);
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.session.count({ where }),
    ]);

    return paginated(res, sessions, total, page, limit);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/admin/sessions/export:
 *   get:
 *     tags: [Admin]
 *     summary: Export JSON manifest of all data for sale packaging
 *     security: [{ apiKeyAuth: [] }]
 *     responses:
 *       200:
 *         description: Export manifest
 */
router.get("/sessions/export", async (_req, res) => {
  try {
    const manifest = await dataService.exportManifest();
    return ok(res, manifest);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/admin/sessions/mark-sold:
 *   post:
 *     tags: [Admin]
 *     summary: Mark sessions as sold and calculate revenue splits
 *     security: [{ apiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionIds, totalSalePrice]
 *             properties:
 *               sessionIds:
 *                 type: array
 *                 items: { type: string }
 *               totalSalePrice: { type: number }
 *               buyerId: { type: string }
 *     responses:
 *       200:
 *         description: Sessions marked as sold
 */
router.post("/sessions/mark-sold", async (req, res) => {
  try {
    const { sessionIds, totalSalePrice, buyerId } = req.body;
    if (!sessionIds?.length || !totalSalePrice) {
      return fail(res, "sessionIds (array) and totalSalePrice (number) are required");
    }

    const result = await dataService.markSold(sessionIds, totalSalePrice, buyerId);
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Payouts ───────────────────────────────────────

/**
 * @openapi
 * /api/admin/payouts:
 *   get:
 *     tags: [Admin]
 *     summary: List all payout requests
 *     security: [{ apiKeyAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by status (pending, processing, completed, failed, rejected)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated payout list
 */
router.get("/payouts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.payout.count({ where }),
    ]);

    return paginated(res, payouts, total, page, limit);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/admin/payouts/{id}/process:
 *   post:
 *     tags: [Admin]
 *     summary: Process a pending payout (triggers Stripe transfer when connected)
 *     security: [{ apiKeyAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payout processed
 */
router.post("/payouts/:id/process", async (req, res) => {
  try {
    const result = await paymentService.processPayout(req.params.id);
    if (!result.success) return fail(res, result.error || "Failed to process payout");
    return ok(res, result);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/admin/payouts/{id}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Reject a payout request
 *     security: [{ apiKeyAuth: [] }]
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
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Payout rejected
 */
router.post("/payouts/:id/reject", async (req, res) => {
  try {
    const payout = await prisma.payout.findUnique({ where: { id: req.params.id } });
    if (!payout) return fail(res, "Payout not found", 404);
    if (payout.status !== "pending") return fail(res, `Payout is ${payout.status}, not pending`);

    const updated = await prisma.payout.update({
      where: { id: req.params.id },
      data: { status: "rejected" },
    });

    return ok(res, updated);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Data Packages ─────────────────────────────────

/**
 * @openapi
 * /api/admin/packages:
 *   get:
 *     tags: [Admin]
 *     summary: List all data packages
 *     security: [{ apiKeyAuth: [] }]
 *     responses:
 *       200:
 *         description: List of data packages
 */
router.get("/packages", async (_req, res) => {
  try {
    const packages = await prisma.dataPackage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sessions: {
          select: { id: true, type: true, durationMinutes: true, dataSizeMB: true, narrationEnabled: true },
        },
      },
    });
    return ok(res, packages);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/admin/packages/create:
 *   post:
 *     tags: [Admin]
 *     summary: Bundle sessions into a sellable data package
 *     security: [{ apiKeyAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionIds]
 *             properties:
 *               sessionIds:
 *                 type: array
 *                 items: { type: string }
 *               name: { type: string }
 *               category: { type: string }
 *     responses:
 *       201:
 *         description: Package created
 */
router.post("/packages/create", async (req, res) => {
  try {
    const { sessionIds, name, category } = req.body;
    if (!sessionIds?.length) return fail(res, "sessionIds array is required");

    const sessions = await prisma.session.findMany({
      where: { id: { in: sessionIds } },
    });

    if (sessions.length === 0) return fail(res, "No sessions found for given IDs");

    const totalSizeMB = sessions.reduce((s, x) => s + x.dataSizeMB, 0);
    const totalDurationMinutes = sessions.reduce((s, x) => s + x.durationMinutes, 0);

    const pkg = await prisma.dataPackage.create({
      data: {
        name: name || `Package ${new Date().toISOString().split("T")[0]}`,
        category: category || "general",
        totalSizeMB: +totalSizeMB.toFixed(1),
        totalDurationMinutes: +totalDurationMinutes.toFixed(2),
        sessions: {
          connect: sessionIds.map((id: string) => ({ id })),
        },
      },
      include: { sessions: { select: { id: true, type: true } } },
    });

    return ok(res, pkg, 201);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/admin/packages/{id}/sell:
 *   post:
 *     tags: [Admin]
 *     summary: Mark a package as sold — triggers earnings split for all included sessions
 *     security: [{ apiKeyAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [salePrice]
 *             properties:
 *               salePrice: { type: number }
 *               buyerId: { type: string }
 *     responses:
 *       200:
 *         description: Package sold and splits calculated
 */
router.post("/packages/:id/sell", async (req, res) => {
  try {
    const { salePrice, buyerId } = req.body;
    if (!salePrice || salePrice <= 0) return fail(res, "salePrice must be > 0");

    const pkg = await prisma.dataPackage.findUnique({
      where: { id: req.params.id },
      include: { sessions: true },
    });
    if (!pkg) return fail(res, "Package not found", 404);

    // Mark sessions as sold with earnings split
    const sessionIds = pkg.sessions.map((s) => s.id);
    const result = await dataService.markSold(sessionIds, salePrice, buyerId);

    // Update package status
    await prisma.dataPackage.update({
      where: { id: req.params.id },
      data: {
        status: "sold",
        salePrice,
        soldAt: new Date(),
        buyerId: buyerId || null,
      },
    });

    return ok(res, { package: req.params.id, ...result, salePrice, buyerId });
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

// ─── Platform Config ───────────────────────────────

/**
 * @openapi
 * /api/admin/config:
 *   get:
 *     tags: [Admin]
 *     summary: Get current platform config (rates, splits)
 *     security: [{ apiKeyAuth: [] }]
 *     responses:
 *       200:
 *         description: Platform config
 */
router.get("/config", async (_req, res) => {
  try {
    const config = await getRates();
    return ok(res, {
      rates: {
        narrated: { perMinute: config.narRatePerMinute, userSplit: config.narUserSplit, platformSplit: config.narPlatformSplit },
        silent: { perMinute: config.silentRatePerMinute, userSplit: config.silentUserSplit, platformSplit: config.silentPlatformSplit },
      },
      azure: {
        configured: !!(process.env.AZURE_STORAGE_ACCOUNT),
        storageAccount: process.env.AZURE_STORAGE_ACCOUNT || "(not set)",
        containerName: process.env.AZURE_CONTAINER_NAME || "clover-recordings",
      },
      stripe: {
        configured: !!(process.env.STRIPE_SECRET_KEY),
      },
    });
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/admin/config:
 *   put:
 *     tags: [Admin]
 *     summary: Update platform rates and splits
 *     security: [{ apiKeyAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               narRatePerMinute: { type: number }
 *               silentRatePerMinute: { type: number }
 *               narUserSplit: { type: number }
 *               narPlatformSplit: { type: number }
 *               silentUserSplit: { type: number }
 *               silentPlatformSplit: { type: number }
 *     responses:
 *       200:
 *         description: Config updated
 */
router.put("/config", async (req, res) => {
  try {
    const allowed = [
      "narRatePerMinute", "silentRatePerMinute",
      "narUserSplit", "narPlatformSplit",
      "silentUserSplit", "silentPlatformSplit",
    ];
    const data: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const config = await prisma.platformConfig.update({
      where: { id: "global" },
      data,
    });

    return ok(res, config);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

export default router;
