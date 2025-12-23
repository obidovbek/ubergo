#!/usr/bin/env node
/**
 * Setup ADB port forwarding for User App (Port 8081)
 */
const { execSync } = require('child_process');

console.log('Setting up ADB reverse for User App (port 8081)...');

try {
  // Remove any existing reverse for port 8081
  try {
    execSync('adb reverse --remove tcp:8081', { stdio: 'pipe' });
  } catch (e) {
    // Ignore if it doesn't exist
  }
  
  // Set up reverse for port 8081
  execSync('adb reverse tcp:8081 tcp:8081', { stdio: 'inherit' });
  console.log('✓ ADB reverse setup complete for port 8081');
  
  // Also setup for dev tools if needed
  try {
    execSync('adb reverse --remove tcp:8097', { stdio: 'pipe' });
  } catch (e) {}
  execSync('adb reverse tcp:8097 tcp:8097', { stdio: 'inherit' });
  console.log('✓ ADB reverse setup complete for port 8097 (devtools)');
  
} catch (error) {
  console.error('Failed to setup ADB reverse:', error.message);
  console.error('Make sure your device is connected via USB and USB debugging is enabled');
  process.exit(1);
}

