# Summer ’27 — go live when you’re ready for Stripe

Everything below is already wired in the app. You only need to fill in accounts and secrets.

## Payment model

**Charge immediately** on booking (no authorize/capture delay). Cancels = Stripe refund when a PaymentIntent id exists.

## 1. Stripe (you)

1. Create/open your Stripe account and finish verification.
2. Switch to **Live** (or start with Test).
3. Copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
4. In Vercel → Project → Settings → Environment Variables, add those for Production (and Preview if you want).
5. Also set:
   - `NEXT_PUBLIC_BASE_URL` = `https://difaziotennis.com` (no trailing slash)
   - `NEXT_PUBLIC_S27_LIVE` = `1` (turns off mock booking seed)
   - `S27_ADMIN_PASSWORD` = a strong desk password

6. Webhook (Dashboard → Developers → Webhooks):
   - URL: `https://difaziotennis.com/api/summer27/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
   - Secret → `STRIPE_WEBHOOK_SECRET`

7. Redeploy after saving env vars.

Until keys exist, the site stays in **demo mode**: fake last-4 cards, demo guest “pay”, no real money.

## 2. What already works in code

| Feature | Status |
|--------|--------|
| Member save card (Stripe Payment Element) | Ready when keys present |
| Member charge on book (immediate) | Ready |
| Guest Stripe Checkout (courts + clinics) | Ready |
| Refund API for cancels | Ready (`/api/summer27/refund`) |
| Webhook handler | Ready |
| Admin password gate | Ready (env or demo) |
| Mock data off when live / Stripe configured | Ready |
| Supabase schema for shared data | SQL file ready — run when you create/use a project |

## 3. Shared database (recommended next, you + optional help)

Bookings still live in each browser’s localStorage until Supabase (or similar) is connected.

1. Open Supabase → SQL → run `supabase/summer27-schema.sql`
2. Add to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — for webhook paid marks)

After that, we can migrate member/booking reads off localStorage in a follow-up.

## 4. Email (optional)

Stringing “ready” and receipts can use your existing mail setup (`GMAIL_USER` / `GMAIL_APP_PASSWORD`) or another provider. Stripe also emails card receipts when `receipt_email` is set on charges.

## 5. Smoke test after keys

1. My Account → Card → save a real test/live card  
2. Book a court as a member → see charge in Stripe  
3. Sign out → book a court as guest → complete Checkout  
4. Cancel within policy → confirm refund in Stripe  
5. Open `/Summer27/admin` with `S27_ADMIN_PASSWORD`

## 6. Still not automatic (needs a follow-up build)

- Full multi-device roster sync (needs Supabase tables above + wiring every list)
- Hardened auth (hashed passwords / magic link) instead of local member accounts
- Guest checkout on every remaining surface (events/lessons/stringing still lean member-first; courts + clinics are guest-ready)
