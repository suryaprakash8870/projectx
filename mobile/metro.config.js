// Metro config — allow importing from /shared (monorepo-style).
// See https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch /shared so edits there hot-reload the mobile app.
config.watchFolders = [path.resolve(workspaceRoot, 'shared')];

// Resolve modules from BOTH the mobile node_modules and the repo root
// (/shared has no node_modules of its own; its imports walk up to root).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
