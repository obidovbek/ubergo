#!/usr/bin/env node
/**
 * Script to run Android with specific Metro port (8081)
 */
const { execSync } = require('child_process');
const path = require('path');

// Setup ADB port forwarding first
console.log('Setting up ADB port forwarding...');
try {
  execSync('node ' + path.join(__dirname, 'setup-ports.js'), { stdio: 'inherit' });
} catch (error) {
  console.error('Warning: Could not setup ADB ports, continuing anyway...');
}

// Set environment variables
process.env.RCT_METRO_PORT = '8081';
process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
process.env.PORT = '8081';
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = 'localhost';

const args = process.argv.slice(2).join(' ');
const command = args.includes('--device') 
  ? 'expo run:android --device' 
  : 'expo run:android';

console.log('Starting User App on port 8081...');
execSync(command, { stdio: 'inherit', env: process.env });

