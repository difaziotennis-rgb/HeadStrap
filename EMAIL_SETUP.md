# Email Notification Setup

## ✅ What's Done

I've added email notifications that will send you an email whenever someone books a lesson. The email includes:
- Client name, email, phone
- Booking date and time
- Amount paid
- Payment status
- Booking ID

## 📧 Setting Up Email Sending

The email system is ready, but you need to configure an email service to actually send emails.

### Option 1: Resend (Recommended - Free & Easy)

**Resend** offers a free tier (3,000 emails/month) and is very easy to set up:

1. **Sign up**: Go to https://resend.com
2. **Create API key**:
   - Go to API Keys
   - Click "Create API Key"
   - Name it: "DiFazio Tennis"
   - Copy the key (starts with `re_...`)

3. **Add to Vercel**:
   - Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
   - Add: `RESEND_API_KEY` = `re_your_api_key_here`
   - Click "Save"
   - Redeploy your site

4. **Verify your domain** (optional but recommended):
   - In Resend, go to "Domains"
   - Add `difaziotennis.com`
   - Add the DNS records Resend provides to your Wix DNS settings

**That's it!** Emails will start sending automatically.

### Option 2: Other Email Services

You can also use:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very cheap, but more complex)

If you want to use a different service, let me know and I can update the code.

## ⚙️ Configure Notification Email

1. **Go to**: https://difaziotennis.com/admin/payment-settings
2. **Log in** as admin
3. **Find**: "Email Notifications" section
4. **Set**: Notification Email = `difaziotennis@gmail.com` (or any email you want)
5. **Click**: "Save Settings"

The default is already set to `difaziotennis@gmail.com`, but you can change it anytime!

## 📨 What You'll Receive

When someone books, you'll get an email with:

**Subject**: `New Booking: [Client Name] - [Date] at [Time]`

**Content**:
- Client Name
- Email & Phone
- Booking Date & Time
- Amount Paid
- Payment Status
- Booking ID

## 🧪 Testing

After setting up Resend:
1. Make a test booking
2. Check your email (including spam folder)
3. You should receive the notification within seconds

## 💡 Notes

- **Free tier**: Resend's free tier (3,000 emails/month) should be plenty for your bookings
- **No setup needed**: The notification email field is already set to `difaziotennis@gmail.com`
- **Change anytime**: You can update the notification email in Payment Settings anytime

Let me know when you've set up Resend and I can help test it!







