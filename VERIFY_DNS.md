# Verify Your DNS Setup

## What You Should Have Done

1. ✅ Added domain in Vercel dashboard
2. ✅ Added domain in Wix DNS settings

## Next: Add DNS Records in Wix

Vercel should have given you DNS records to add. They typically look like:

### Option 1: A Record (IP Address)
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21 (example - Vercel will give you the actual IP)
TTL: Auto (or 3600)
```

### Option 2: CNAME Record
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com (example - Vercel will give you the actual value)
TTL: Auto (or 3600)
```

## Steps to Add in Wix

1. **Go to Wix Dashboard** → **Domains** → **difaziotennis.com**
2. **Click "DNS Settings"** or **"Manage DNS"**
3. **Add the records Vercel provided:**
   - For the root domain (@): Usually an A record
   - For www: Usually a CNAME record
4. **Save/Apply changes**

## Verify It's Working

After adding the records, wait 5-60 minutes, then check:

```bash
# Check if domain points to Vercel
dig difaziotennis.com +short

# Check www subdomain
dig www.difaziotennis.com +short
```

Or visit: https://dnschecker.org and search for your domain

## Common Issues

### If domain still shows Wix:
- DNS records might not have propagated yet (wait up to 60 minutes)
- Records might be incorrect (double-check in Wix)
- Wrong record type (make sure A record for root, CNAME for www)

### If you can't find DNS settings in Wix:
- Look for "Advanced DNS" or "DNS Management"
- You might need to disconnect from Wix website first
- Contact Wix support if DNS is locked

## What Vercel Should Show You

In Vercel dashboard → Your Project → Settings → Domains:
- It should show the domain
- It might show "Pending" or "Validating"
- Once DNS is correct, it will show "Valid" or "Active"

Let me know:
1. What DNS records did Vercel give you?
2. What do you see in your Wix DNS settings?
3. What does Vercel show for the domain status?








