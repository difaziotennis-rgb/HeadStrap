import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { ok, fail } from "../lib/response";
import { signToken } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Account created successfully
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !name) {
      return fail(res, "Email and name are required");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return fail(res, "Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password || "default", 10);

    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    const token = signToken(user.id);

    return ok(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        verified: user.verified,
        calibrated: user.calibrated,
        payoutMethod: user.payoutMethod,
        createdAt: user.createdAt.toISOString(),
      },
    }, 201);
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return fail(res, "Email is required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Auto-create for easy testing (same pattern as current frontend)
      const passwordHash = await bcrypt.hash(password || "default", 10);
      const newUser = await prisma.user.create({
        data: { email, name: email.split("@")[0], passwordHash },
      });
      const token = signToken(newUser.id);
      return ok(res, {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          verified: newUser.verified,
          calibrated: newUser.calibrated,
          payoutMethod: newUser.payoutMethod,
          createdAt: newUser.createdAt.toISOString(),
        },
      });
    }

    // Validate password (skip if empty — easy testing mode)
    if (password) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return fail(res, "Invalid password", 401);
      }
    }

    const token = signToken(user.id);

    return ok(res, {
      token,
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
    });
  } catch (e: any) {
    return fail(res, e.message, 500);
  }
});

export default router;
