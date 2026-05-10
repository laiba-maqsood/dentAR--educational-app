// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .glb and .gltf to asset extensions so Metro can bundle them
config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;
