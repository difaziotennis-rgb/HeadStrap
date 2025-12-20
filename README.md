# DiFazio Tennis Booking System

A beautiful, minimalistic tennis lesson booking website for DiFazio Tennis at Rhinebeck Tennis Club, featuring a Hudson Valley-inspired design.

## Features

- ✅ **12-Month Calendar View** - Browse availability across the entire year
- ✅ **Hour-by-Hour Booking** - Select specific time slots (9 AM - 7 PM)
- ✅ **Admin Dashboard** - Easily set available times by clicking time slots
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Hudson Valley Theme** - Natural, elegant color palette
- ✅ **Booking Confirmation** - Success page with booking details
- ✅ **Payment Ready** - Structure in place for future payment integration

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Pages

- `/book` - Main booking page for clients
- `/admin/login` - Admin login (default: admin@difaziotennis.com / admin123)
- `/admin/dashboard` - Admin panel to manage availability
- `/booking-success` - Booking confirmation page

## Admin Features

1. **Login**: Use admin@difaziotennis.com / admin123
2. **Set Availability**: 
   - Click on any date in the calendar
   - Click time slots to toggle availability (green = available, gray = unavailable)
   - Use "Make All Available" or "Make All Unavailable" for bulk operations
3. **View Bookings**: See total bookings and today's lessons in the dashboard

## Booking Flow

1. Client visits `/book`
2. Views 12-month calendar or specific month
3. Selects a date with availability
4. Chooses a time slot
5. Fills out booking form (name, email, phone)
6. Confirms booking
7. Redirected to success page

## Payment Integration

The app is structured to easily add payment integration. See `lib/payment-integration.ts` for the prepared structure. Ready for:
- Stripe
- PayPal
- Venmo
- Cash/Check options

## Design

- **Colors**: Natural greens, warm earth tones, elegant accents
- **Typography**: Playfair Display (serif) for headings, Inter (sans-serif) for body
- **Theme**: Hudson Valley inspired - natural, professional, welcoming

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- date-fns for date handling
- Lucide React for icons


