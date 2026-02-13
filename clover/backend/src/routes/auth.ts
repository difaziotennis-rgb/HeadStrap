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

    if (!password || password.length < 6) {
      return fail(res, "Password must be at least 6 characters");
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return fail(res, "Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email: normalizedEmail, name: name.trim(), passwordHash },
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
 *             required: [email, password]
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
    if (!password) {
      return fail(res, "Password is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return fail(res, "Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return fail(res, "Invalid email or password", 401);
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
