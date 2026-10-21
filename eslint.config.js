// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  // supabase/functions — код для Deno, перевіряється окремо під час деплою.
  globalIgnores([
    'dist/*',
    '.expo/*',
    'ios/*',
    'android/*',
    'expo-env.d.ts',
    'supabase/functions/*',
  ]),
  expoConfig,
  eslintPluginPrettierRecommended,
]);
