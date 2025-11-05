#!/usr/bin/env node

const { execSync } = require('child_process');

// Executar prisma generate antes do build
console.log('🔄 Generating Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully');
} catch (error) {
  console.error('❌ Error generating Prisma Client:', error.message);
  process.exit(1);
}