# Tennis Club Management System - Prototype

A comprehensive club management system for a small tennis club (5 courts) on Long Island, NY.

## Features

### 🎯 Core Functionality

1. **Member Management**
   - View all members with contact information
   - Search and filter members
   - Quick access to email/phone
   - Track member status (active/inactive)
   - Bulk email all members

2. **Calendar & Event Management**
   - View all lessons and clinics in calendar format
   - See enrollment status and availability
   - Quick stats (total events, full clinics, available spots)
   - Create new events (lessons or clinics)
   - Track capacity and enrollment

3. **Messaging System**
   - Send messages to all members, active members, or select specific members
   - **AI-Powered Message Assistant** - Automatically generate professional messages
   - Preview messages before sending
   - Email blast functionality

4. **Member-Facing Portal**
   - View available clinics and lessons
   - See event details, pricing, and availability
   - Sign up for events directly
   - Real-time availability updates

## Pages

### Admin Pages (Club Owner)
- `/club-admin` - Main dashboard with stats and quick actions
- `/club-admin/members` - Member management
- `/club-admin/calendar` - Calendar view of all events
- `/club-admin/messages` - Message composition and sending
- `/club-admin/add-event` - Create new lesson or clinic

### Member-Facing Pages
- `/club-members` - Public view of available events for sign-up

## How to Use

### For Demo/Presentation

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **View Admin Dashboard:**
   - Navigate to: `http://localhost:3000/club-admin`
   - Explore member management, calendar, and messaging

3. **View Member Portal:**
   - Navigate to: `http://localhost:3000/club-members`
   - See how members view and sign up for events

### Key Demo Features

1. **Member Management** (`/club-admin/members`)
   - Shows mock member list
   - Search functionality
   - Quick email/phone actions
   - Bulk email option

2. **Calendar** (`/club-admin/calendar`)
   - View upcoming events
   - See enrollment status
   - Filter by date
   - Quick stats sidebar

3. **AI Messaging** (`/club-admin/messages`)
   - Click "Generate Message" to see AI assistant
   - Select recipients (All/Active/Selected)
   - Preview and send messages

4. **Add Event** (`/club-admin/add-event`)
   - Create new lessons or clinics
   - Set capacity, pricing, instructor
   - Define date and time

5. **Member Sign-Up** (`/club-members`)
   - Browse available events
   - See real-time availability
   - Sign up functionality

## Current Status

✅ **Prototype Complete** - All core features implemented with mock data

### Next Steps for Production

1. **Database Integration**
   - Connect to database (Supabase/Firebase/etc.)
   - Store members, events, enrollments

2. **Email Integration**
   - Integrate email service (SendGrid, Mailgun, etc.)
   - Send actual emails to members
   - Track sent messages

3. **AI Integration**
   - Connect to OpenAI API or similar
   - Generate context-aware messages
   - Customize based on event types

4. **Authentication**
   - Admin login/password protection
   - Member login (optional)

5. **Payment Processing** (if needed)
   - Stripe integration for paid events
   - Payment tracking

6. **Real-time Updates**
   - Live availability updates
   - Push notifications for new events

## Design Notes

- Modern, clean UI using your existing design system
- Responsive design (works on mobile)
- Uses existing color scheme (Hudson Valley theme)
- Consistent with your main site design

## Mock Data

The prototype uses mock data for demonstration. In production, this would be replaced with:
- Real member database
- Real event/calendar data
- Actual email/phone functionality
- Real-time enrollment tracking

---

**Ready for client presentation!** 🎾

