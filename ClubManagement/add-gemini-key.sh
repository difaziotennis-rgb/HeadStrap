#!/bin/bash

# Add Gemini API key to .env.local

GEMINI_KEY="AIzaSyDMbmEBlPoi6U_DENrrr5xU52CTCCfD1UM"
ENV_FILE=".env.local"

# Check if .env.local exists, if not create it
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/clubmanagement?schema=public"

# Google Gemini API (for AI features)
GOOGLE_GEMINI_API_KEY=""

# Google OAuth (for Calendar/Sheets integration)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3001/api/google/callback"

# OpenAI (optional - for AI features)
OPENAI_API_KEY=""

# Stripe (optional)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
EOF
fi

# Update or add Gemini API key
if grep -q "GOOGLE_GEMINI_API_KEY=" "$ENV_FILE"; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|GOOGLE_GEMINI_API_KEY=.*|GOOGLE_GEMINI_API_KEY=\"$GEMINI_KEY\"|" "$ENV_FILE"
    else
        sed -i "s|GOOGLE_GEMINI_API_KEY=.*|GOOGLE_GEMINI_API_KEY=\"$GEMINI_KEY\"|" "$ENV_FILE"
    fi
else
    echo "GOOGLE_GEMINI_API_KEY=\"$GEMINI_KEY\"" >> "$ENV_FILE"
fi

echo "✓ Gemini API key has been added to .env.local"
echo ""
echo "Current key: $GEMINI_KEY"

