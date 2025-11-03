const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure React DevTools is properly configured
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ignore problematic directories that Metro shouldn't watch
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /\.gradle\/.*/,
  /android\/\.gradle\/.*/,
  /android\/app\/build\/.*/,
];

module.exports = config;

