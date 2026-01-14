#!/bin/bash

# Script to add Google API keys to .env.local file
# Usage: ./setup-google-keys.sh "your-client-id" "your-client-secret"

if [ "$#" -ne 2 ]; then
    echo "Usage: ./setup-google-keys.sh \"your-client-id\" \"your-client-secret\""
    exit 1
fi

CLIENT_ID=$1
CLIENT_SECRET=$2
ENV_FILE=".env.local"

# Check if .env.local exists, if not create it from template
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env.local file..."
    cat > "$ENV_FILE" << EOF
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/clubmanagement?schema=public"

# Google API Configuration
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3001/api/google/callback"

# OpenAI (for AI features)
OPENAI_API_KEY=""

# Stripe (optional)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
EOF
fi

# Update Google API keys using sed
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=\"$CLIENT_ID\"|" "$ENV_FILE"
    sed -i '' "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=\"$CLIENT_SECRET\"|" "$ENV_FILE"
else
    # Linux
    sed -i "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=\"$CLIENT_ID\"|" "$ENV_FILE"
    sed -i "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=\"$CLIENT_SECRET\"|" "$ENV_FILE"
fi

echo "✓ Google API keys have been added to .env.local"
echo ""
echo "Next steps:"
echo "1. Verify your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local"
echo "2. Make sure the redirect URI in Google Cloud Console is set to: http://localhost:3001/api/google/callback"
echo "3. Restart your development server (npm run dev)"
echo "4. Go to /admin/integrations and click 'Connect' on Google Calendar"

