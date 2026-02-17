module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true }, // Add node: true to recognize process
  globals: {
    process: 'readonly', // Define process as a readonly global
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'server.js'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'warn',
    'react/prop-types': 'off', // Disable prop-types validation
    'react/react-in-jsx-scope': 'off', // No need to import React in JSX files for React 17+
    'no-unused-vars': 'off', // Temporarily disable to clean up other errors
    'react/no-unescaped-entities': 'off', // Temporarily disable
  },
};
