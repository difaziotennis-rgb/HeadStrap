# EliteClub OS

## Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory with your database connection:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/clubmanagement?schema=public"
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions.

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3001` and log in with:
- **Admin**: admin@eliteclub.com / admin123
- **Member**: member@eliteclub.com / member123

---

# EliteClub OS

**Premium Country Club & Tennis Management System**

A comprehensive, high-end Country Club Management System (CMS) designed to rival industry leaders like Clubessential and Northstar in functionality and aesthetic.

## 🎨 Visual Identity

**Aesthetic:** Modern Luxury
- **Deep Navy:** `#0A192F` - Primary brand color
- **Forest Green:** `#1B4332` - Secondary accents
- **Champagne Gold:** `#C5A059` - Premium highlights

**Typography:**
- **Headings:** Cormorant Garamond (Serif) - Elegant and sophisticated
- **Body:** Inter (Sans-serif) - Clean and readable

## 🏗️ Architecture

### Core Features

1. **Member Core:** CRM with tiered membership logic (Full, Social, Tennis, Junior), family linking, and member "House Accounts"

2. **Tee Time & Court Engine:** High-performance grid for booking tennis courts and tee times with drag-and-drop scheduling

3. **Unified POS:** Touch-responsive interface for F&B and Pro Shop sales that syncs to member monthly statements

4. **Financial Suite:** Automated billing engine with monthly dues, ACH/Credit Card processing via Stripe, and A/R management

5. **Member Portal:** Member-facing dashboard for viewing statements, booking lessons, and registering for tournaments

### Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **State Management:** TanStack Query (React Query)
- **UI Components:** Shadcn/UI with Radix UI primitives
- **Styling:** Tailwind CSS
- **Charts:** Recharts for analytics
- **Payments:** Stripe integration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- (Optional) Stripe account for payment processing

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database URL and API keys
```

3. **Set up Prisma:**
```bash
npx prisma generate
npx prisma db push
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
- Admin Dashboard: [http://localhost:3001/admin/dashboard](http://localhost:3001/admin/dashboard)
- Member Dashboard: [http://localhost:3001/member/dashboard](http://localhost:3001/member/dashboard)

## 📁 Project Structure

```
ClubManagement/
├── app/
│   ├── admin/          # Admin dashboard routes
│   │   └── dashboard/  # Director's dashboard
│   ├── member/         # Member portal routes
│   └── api/            # API routes (to be implemented)
├── components/
│   ├── ui/             # Reusable UI components
│   ├── dashboard/      # Dashboard-specific components
│   └── navigation.tsx  # Main navigation component
├── lib/
│   ├── prisma.ts       # Prisma client
│   └── utils.ts        # Utility functions
└── prisma/
    └── schema.prisma   # Database schema
```

## 🎯 Current Status

### ✅ Completed

- Prisma schema with all core entities
- Luxury design system with custom color palette
- Admin and Member navigation shells
- Director's Dashboard with revenue and occupancy metrics
- Recharts integration for analytics
- TanStack Query setup
- Responsive UI components

### 🚧 In Progress

- API routes for data fetching
- Member booking interface
- POS system interface
- Financial suite integration

### 📋 Planned

- Drag-and-drop court booking
- Stripe payment integration
- Event registration system
- Reporting suite
- Member mobile app

## 📊 Database Schema

The system uses Prisma ORM with PostgreSQL. Key entities include:

- **Members** - Core member data with tiered membership
- **Courts & TeeTimes** - Facility availability
- **Bookings** - Court and tee time reservations
- **Transactions & Statements** - Financial records
- **POS** - Point of sale items and sales
- **Events** - Tournament and social event management

## 🎨 Design Principles

1. **White Space:** Generous spacing for elegance
2. **High Contrast:** Excellent readability
3. **Smooth Transitions:** Subtle animations for premium feel
4. **Touch Responsive:** Optimized for tablet POS usage
5. **Accessibility:** WCAG compliant components

## 📝 Development Notes

- This project runs on port **3001** to avoid conflicts with the main website
- Currently for local development only
- Will be integrated into difaziotennis.com as `/ClubManagement` when ready

## 🔐 Environment Variables

See `.env.example` for required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## 📚 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Recharts](https://recharts.org/)

