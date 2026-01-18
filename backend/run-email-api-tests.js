#!/usr/bin/env node

/**
 * Test runner for organizational email routing API tests
 * Runs only the email-related tests from organizational-structure and section-email-api
 */

import { spawn } from 'child_process';

console.log('🧪 Running Organizational Email Routing API Tests...\n');

// Run organizational structure tests with email filter
const testProcess = spawn('npm', ['test', '--', 
  'tests/integration/organizational-structure.test.js',
  'tests/integration/section-email-api.test.js',
  '--grep', 'email|Email'
], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All email API tests passed!');
  } else {
    console.log(`\n❌ Tests failed with exit code ${code}`);
  }
  process.exit(code);
});
