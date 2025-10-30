const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure React DevTools is properly configured
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
