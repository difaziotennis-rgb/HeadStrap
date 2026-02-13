#!/bin/bash
# Generate secure random secrets for production deployment

echo "─── Clover Production Secrets ───"
echo ""
echo "Copy these into your production .env file:"
echo ""
echo "JWT_SECRET=\"$(openssl rand -base64 48)\""
echo "ADMIN_API_KEY=\"$(openssl rand -base64 32)\""
echo ""
echo "─────────────────────────────────"
