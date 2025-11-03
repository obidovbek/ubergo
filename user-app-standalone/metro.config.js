const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the app directory (where this config file is located)
const appDir = __dirname;

const config = getDefaultConfig(appDir);

// Ensure React DevTools is properly configured
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Set the project root explicitly to the app directory
config.projectRoot = appDir;

// Set watch folders to the app directory to avoid monorepo issues
config.watchFolders = [appDir];

// Configure resolver to look in the app directory first
config.resolver.sourceExts = [...(config.resolver.sourceExts || [])];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Ignore problematic directories that Metro shouldn't watch
config.resolver.blockList = [
  /\.gradle\/.*/,
  /android\/\.gradle\/.*/,
  /android\/app\/build\/.*/,
];

module.exports = config;
