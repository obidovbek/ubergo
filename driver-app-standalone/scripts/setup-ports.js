#!/usr/bin/env node
/**
 * Setup ADB port forwarding for Driver App (Port 8082)
 */
const { execSync } = require('child_process');

console.log('Setting up ADB reverse for Driver App (port 8082)...');

try {
  // Remove any existing reverse for port 8082
  try {
    execSync('adb reverse --remove tcp:8082', { stdio: 'pipe' });
  } catch (e) {
    // Ignore if it doesn't exist
  }
  
  // Set up reverse for port 8082
  execSync('adb reverse tcp:8082 tcp:8082', { stdio: 'inherit' });
  console.log('✓ ADB reverse setup complete for port 8082');
  
  // Also setup for dev tools if needed (use different port)
  try {
    execSync('adb reverse --remove tcp:8098', { stdio: 'pipe' });
  } catch (e) {}
  execSync('adb reverse tcp:8098 tcp:8098', { stdio: 'inherit' });
  console.log('✓ ADB reverse setup complete for port 8098 (devtools)');
  
} catch (error) {
  console.error('Failed to setup ADB reverse:', error.message);
  console.error('Make sure your device is connected via USB and USB debugging is enabled');
  process.exit(1);
}

