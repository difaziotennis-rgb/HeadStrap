#!/usr/bin/env node

/**
 * Interactive Supabase Setup Script
 * Helps you create .env.local with Supabase credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🔧 Supabase Setup\n');
  console.log('This will create a .env.local file with your Supabase credentials.\n');
  console.log('To find your credentials:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings > API');
  console.log('4. Copy the Project URL and anon public key\n');

  const url = await question('Enter your Supabase Project URL: ');
  if (!url || !url.includes('supabase.co')) {
    console.log('\n❌ Invalid URL. Please enter a valid Supabase URL (e.g., https://xxxxx.supabase.co)');
    rl.close();
    return;
  }

  const key = await question('Enter your Supabase anon/public key: ');
  if (!key || !key.startsWith('eyJ')) {
    console.log('\n❌ Invalid key. Please enter a valid anon key (should start with eyJ...)');
    rl.close();
    return;
  }

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  let existingContent = '';
  
  if (fs.existsSync(envPath)) {
    existingContent = fs.readFileSync(envPath, 'utf8');
    console.log('\n⚠️  .env.local already exists. Adding Supabase variables...');
  }

  // Create or update .env.local
  let envContent = existingContent;
  
  // Remove old Supabase variables if they exist
  envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*\n/g, '');
  envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*\n/g, '');
  
  // Add Supabase variables
  if (!envContent.endsWith('\n') && envContent.length > 0) {
    envContent += '\n';
  }
  envContent += `# Supabase Configuration\n`;
  envContent += `NEXT_PUBLIC_SUPABASE_URL=${url.trim()}\n`;
  envContent += `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key.trim()}\n`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Created/updated .env.local successfully!');
    console.log(`   Location: ${envPath}\n`);
    console.log('Next steps:');
    console.log('1. Run: node check-supabase-connection.js (to test the connection)');
    console.log('2. Run: npm run dev (to start the app)\n');
  } catch (error) {
    console.log('\n❌ Error creating .env.local file:');
    console.log(error.message);
  }

  rl.close();
}

setup();

