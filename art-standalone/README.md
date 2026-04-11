# E. DiFazio Art — standalone site

This is Ellen’s portfolio and shop as a **self-contained** [Next.js](https://nextjs.org/) app (extracted from a larger project). Routes live at the **site root** (`/`, `/shop`, `/about`), not under `/art`.

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in .env.local, then:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this folder to **your own** GitHub repository.
2. [Vercel](https://vercel.com) → **New Project** → Import that repo.
3. Add **Environment variables** (Production) — see `.env.example`. Set `NEXT_PUBLIC_BASE_URL` to your live URL (e.g. `https://edifazioart.net`).
4. **Domains** → connect `edifazioart.net` and follow DNS instructions at your registrar.
5. In **Stripe**, add a webhook endpoint:  
   `https://YOUR_DOMAIN/api/art/stripe-webhook`  
   with event `checkout.session.completed`, then paste the signing secret into `STRIPE_WEBHOOK_SECRET_ART`.

## Project layout

- `app/` — pages (`/`, `/about`, `/shop`, …) and `app/api/art/*` (checkout, CV PDF, Stripe webhook)
- `components/art/` — UI
- `lib/art/` — catalog JSON, copy, helpers
- `lib/send-email.ts` — Gmail SMTP for sale notifications

## Legacy URLs

Old links that used `/art/...` redirect to the new paths (e.g. `/art/shop` → `/shop`).
