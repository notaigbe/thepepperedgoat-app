const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Configure platform-specific extensions with proper priority
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'tsx', 'ts', 'jsx', 'js'];

// Ensure platforms are defined
config.resolver.platforms = ['ios', 'android', 'web'];

// Always block .native files on web platform
// Metro will handle this automatically based on the platform you're bundling for
const blacklistRE = /\.native\.(tsx?|jsx?)$/;

if (config.resolver.blockList) {
  // Expo SDK 50+
  config.resolver.blockList = [blacklistRE];
} else if (config.resolver.blacklistRE) {
  // Older Expo versions
  config.resolver.blacklistRE = blacklistRE;
} else {
  // Fallback
  config.resolver.blacklistRE = blacklistRE;
}

module.exports = config;