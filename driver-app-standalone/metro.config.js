const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Set Metro port for driver app (8082)
config.server = {
  ...config.server,
  port: 8082,
};

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

