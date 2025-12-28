#!/usr/bin/env node

/**
 * Check Supabase Connection
 * This script verifies that Supabase is properly configured
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

const env = loadEnvFile();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Checking Supabase Connection...\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('❌ Missing environment variables!\n');
  console.log('Please create a `.env.local` file in the project root with:');
  console.log('\nNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n');
  console.log('You can find these values in your Supabase dashboard:');
  console.log('Settings > API > Project URL and anon public key\n');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_KEY.substring(0, 20)}...\n`);

// Test connection by fetching from Supabase
const url = new URL(SUPABASE_URL);
const options = {
  hostname: url.hostname,
  path: '/rest/v1/clubs?select=id&limit=1',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  },
};

console.log('🔌 Testing connection to Supabase...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 206) {
      console.log('✅ Connection successful!');
      console.log(`   Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log(`   Found ${Array.isArray(json) ? json.length : 'data'} in clubs table\n`);
      } catch (e) {
        console.log('   Response received (connection working)\n');
      }
    } else if (res.statusCode === 401) {
      console.log('❌ Authentication failed');
      console.log('   Your anon key might be incorrect\n');
    } else if (res.statusCode === 404) {
      console.log('⚠️  Connection works, but clubs table might not exist');
      console.log('   Make sure you\'ve run the database schema in Supabase\n');
    } else {
      console.log(`⚠️  Unexpected status: ${res.statusCode}`);
      console.log(`   Response: ${data.substring(0, 200)}\n`);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Connection failed!');
  console.log(`   Error: ${error.message}\n`);
  console.log('Please check:');
  console.log('1. Your Supabase URL is correct');
  console.log('2. Your internet connection is working');
  console.log('3. Your Supabase project is active\n');
});

req.end();

