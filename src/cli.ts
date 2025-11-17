#!/usr/bin/env node

import { syncPyprojectDeps } from './lib/sync';

async function main() {
  // 명령줄 인자 파싱
  const args = process.argv.slice(2);
  const targetPath = args[0] || '.';

  console.log(`🔍 Starting sync from: ${targetPath}`);

  try {
    await syncPyprojectDeps(targetPath);
    console.log('✅ Sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
