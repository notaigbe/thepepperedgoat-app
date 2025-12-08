
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Add .mjs and .cjs to source extensions to handle ESM modules
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', 'mjs', 'cjs', 'json'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver configuration to handle platform-specific files and ESM modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

// Ensure proper resolution of platform-specific files and ESM modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Let Metro handle the default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
