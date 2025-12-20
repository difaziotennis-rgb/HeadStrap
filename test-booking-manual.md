# Manual Booking Test Steps

## Test the Complete Booking Flow

1. **Make slots available (as admin):**
   - Scroll to bottom, click "Admin Login"
   - Login: `admin` / `admin`
   - Click a future date (e.g., tomorrow)
   - Click time slots to make them available (green = available)
   - Logout

2. **Book a lesson (as client):**
   - Click the same date you just made available
   - Click an available time slot
   - Modal should open
   - Fill out form (or leave empty - all fields optional)
   - Click "Confirm Booking"
   - Should redirect to success page
   - Booking should be saved

3. **Verify booking:**
   - Go back to booking page
   - Click the same date
   - The booked time slot should show as "Booked" (red)
   - Login as admin again
   - The slot should show as booked in admin view

## Expected Behavior

- ✅ Modal opens when clicking available time slot
- ✅ Form submits when clicking "Confirm Booking"
- ✅ Redirects to success page after booking
- ✅ Booking is saved and slot is marked as booked
- ✅ Booked slots show as unavailable to other clients


