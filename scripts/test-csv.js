/**
 * Test script to verify CSV file is accessible and parseable
 * Run with: node scripts/test-csv.js
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

console.log('🔍 Testing CSV file...\n');

const csvPath = path.join(__dirname, '..', 'nsw-property-sales-data-updated20251006.csv');

// Check if file exists
if (!fs.existsSync(csvPath)) {
  console.error('❌ CSV file not found at:', csvPath);
  process.exit(1);
}

// Get file stats
const stats = fs.statSync(csvPath);
console.log('✅ CSV file found!');
console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Path: ${csvPath}\n`);

// Read first few lines
console.log('📖 Reading first 10 records...\n');

try {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(0, 11); // Header + 10 records
  const sample = lines.join('\n');
  
  const records = parse(sample, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`✅ Successfully parsed ${records.length} records\n`);
  console.log('📊 Sample record:');
  console.log(JSON.stringify(records[0], null, 2));
  console.log('\n✅ CSV file is valid and ready to use!');
  
} catch (error) {
  console.error('❌ Error parsing CSV:', error.message);
  process.exit(1);
}

