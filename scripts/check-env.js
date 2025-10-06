/**
 * Check if environment variables are set correctly
 * Run with: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment configuration...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('\n💡 Create a .env.local file with:');
  console.log('   GEMINI_API_KEY=your_api_key_here\n');
  process.exit(1);
}

console.log('✅ .env.local file exists\n');

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let geminiKeyFound = false;
let geminiKeyValue = '';

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    
    if (key.trim() === 'GEMINI_API_KEY') {
      geminiKeyFound = true;
      geminiKeyValue = value;
    }
  }
});

if (!geminiKeyFound) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  console.log('\n💡 Add this line to .env.local:');
  console.log('   GEMINI_API_KEY=your_api_key_here\n');
  process.exit(1);
}

console.log('✅ GEMINI_API_KEY is set');

// Check if it looks like a real key (not the placeholder)
if (geminiKeyValue === 'your_gemini_api_key_here' || 
    geminiKeyValue === 'your_api_key_here' ||
    geminiKeyValue.length < 20) {
  console.log('⚠️  Warning: GEMINI_API_KEY looks like a placeholder');
  console.log('   Value:', geminiKeyValue);
  console.log('\n💡 Replace it with your actual Gemini API key from:');
  console.log('   https://makersuite.google.com/app/apikey\n');
} else {
  console.log(`   Length: ${geminiKeyValue.length} characters`);
  console.log(`   Preview: ${geminiKeyValue.substring(0, 10)}...${geminiKeyValue.substring(geminiKeyValue.length - 5)}`);
  console.log('\n✅ Environment configuration looks good!\n');
}

