#!/usr/bin/env node

// Helper script to add Google API keys to .env.local
// Usage: node add-google-keys.js "client-id" "client-secret"

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

if (process.argv.length !== 4) {
  console.error('Usage: node add-google-keys.js "client-id" "client-secret"');
  process.exit(1);
}

const clientId = process.argv[2];
const clientSecret = process.argv[3];

let envContent = '';

// Read existing .env.local if it exists
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  // Create default .env.local content
  envContent = `# Database
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
`;
}

// Update or add Google API keys
if (envContent.includes('GOOGLE_CLIENT_ID=')) {
  envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/g, `GOOGLE_CLIENT_ID="${clientId}"`);
} else {
  envContent += `\nGOOGLE_CLIENT_ID="${clientId}"`;
}

if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
  envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*/g, `GOOGLE_CLIENT_SECRET="${clientSecret}"`);
} else {
  envContent += `\nGOOGLE_CLIENT_SECRET="${clientSecret}"`;
}

// Ensure redirect URI is set
if (!envContent.includes('GOOGLE_REDIRECT_URI=')) {
  envContent += `\nGOOGLE_REDIRECT_URI="http://localhost:3001/api/google/callback"`;
}

fs.writeFileSync(envPath, envContent, 'utf8');

console.log('✓ Google API keys have been successfully added to .env.local');
console.log('');
console.log('Next steps:');
console.log('1. Verify your settings in .env.local');
console.log('2. Make sure redirect URI in Google Cloud Console is: http://localhost:3001/api/google/callback');
console.log('3. Enable Google Calendar API in your Google Cloud project');
console.log('4. Restart your dev server: npm run dev');
console.log('5. Go to /admin/integrations and click "Connect" on Google Calendar');

