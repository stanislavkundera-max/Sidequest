const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer the React Native/CommonJS entrypoints.
// This avoids Metro selecting `react-native-paper/lib/module/*` (ESM),
// which can fail resolution on some Expo/Windows setups.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;

