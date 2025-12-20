# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `difazio-tennis-booking` (or your preferred name)
4. Disable Google Analytics (optional, you can enable later)
5. Click "Create project"
6. Wait for project to be created, then click "Continue"

## Step 2: Enable Authentication

1. In Firebase Console, click "Authentication" in the left menu
2. Click "Get started"
3. Click "Sign-in method" tab
4. Click on "Google"
5. Toggle "Enable" to ON
6. Select your project support email (your Google email)
7. Click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Select "Start in test mode" (we'll add security rules later)
4. Choose a location (closest to you)
5. Click "Enable"

## Step 4: Get Your Firebase Config

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register app with nickname: "DiFazio Tennis Booking"
6. Copy the `firebaseConfig` object

## Step 5: Add Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Firebase config values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   
   NEXT_PUBLIC_ADMIN_EMAIL=your_google_email@gmail.com
   ```

3. Replace `your_google_email@gmail.com` with your actual Google email address

## Step 6: Set Up Firestore Security Rules

1. In Firebase Console, go to "Firestore Database" > "Rules"
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read bookings and time slots
    match /bookings/{bookingId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (request.auth.token.email == resource.data.clientEmail || 
         request.auth.token.email.matches('.*@difaziotennis.com$'));
    }
    
    // Anyone can read time slots, only admins can write
    match /timeSlots/{slotId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email.matches('.*@difaziotennis.com$');
    }
  }
}
```

3. Click "Publish"

## Step 7: Test the Setup

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000/book

3. Try logging in with Google!

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure your `.env.local` file has all the required variables
- Restart your dev server after adding environment variables

### "Firebase: Error (auth/popup-closed-by-user)"
- User closed the popup - this is normal, just try again

### "Permission denied" in Firestore
- Check your Firestore security rules
- Make sure you're authenticated

## Next Steps

Once Firebase is set up, I'll help you:
1. Create login/signup pages
2. Replace mock data with Firestore
3. Add user authentication to admin routes
4. Store bookings in the database

Let me know when you've completed the Firebase setup!


