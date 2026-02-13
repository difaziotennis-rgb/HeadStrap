# Clover Backend API

Real backend server for the Clover data collection platform.

## Quick Start

```bash
cd clover/backend
npm install
npx prisma migrate dev    # Create/update database
npx tsx prisma/seed.ts     # Seed default config
npm run dev                # Start dev server on :4000
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:4000/api/docs
- **OpenAPI JSON**: http://localhost:4000/api/docs.json

AI agents can fetch the JSON spec to discover all endpoints programmatically.

## Authentication

**User endpoints** — JWT token:
```
Authorization: Bearer <token>
```

**Admin endpoints** — API key:
```
X-API-Key: clover-admin-key-change-in-production
```

## Key Admin Endpoints (for AI agents)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Platform metrics overview |
| GET | /api/admin/users | List all users (paginated) |
| GET | /api/admin/users/:id | User detail + earnings |
| GET | /api/admin/sessions | List sessions (filterable) |
| GET | /api/admin/sessions/export | Export data manifest |
| POST | /api/admin/sessions/mark-sold | Mark sessions as sold |
| GET | /api/admin/payouts | List all payouts |
| POST | /api/admin/payouts/:id/process | Process a payout |
| POST | /api/admin/packages/create | Bundle sessions for sale |
| POST | /api/admin/packages/:id/sell | Sell a package |
| GET | /api/admin/config | View rates/splits |
| PUT | /api/admin/config | Update rates/splits |

## Environment Variables

Copy `.env` and update for production:

| Variable | Description |
|----------|-------------|
| DATABASE_URL | Database connection (SQLite for dev, PostgreSQL for prod) |
| JWT_SECRET | Secret for signing JWT tokens |
| ADMIN_API_KEY | API key for admin endpoints |
| STRIPE_SECRET_KEY | Stripe API key (wire up later) |
| AZURE_STORAGE_ACCOUNT | Azure Blob Storage account (wire up later) |

## Switching to Azure PostgreSQL

1. Change `DATABASE_URL` to your Azure PostgreSQL connection string
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
3. Run `npx prisma migrate dev` to apply the schema
