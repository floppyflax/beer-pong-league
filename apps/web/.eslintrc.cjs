/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', 'playwright-report', 'tests/e2e'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh'],
  rules: {
    // React Refresh — too many false positives in context/provider files. Off for now, revisit Phase B.
    'react-refresh/only-export-components': 'off',

    // Unsafe any is too noisy during the DS migration — revisit in Phase B
    '@typescript-eslint/no-explicit-any': 'off',

    // Allow unused vars/params prefixed with _ (TypeScript convention)
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    'no-unused-vars': 'off', // replaced by @typescript-eslint/no-unused-vars

    // Empty catch blocks are common in defensive code
    '@typescript-eslint/no-empty-function': 'off',

    // Allow empty object types (common in React prop spreading)
    '@typescript-eslint/no-empty-object-type': 'off',

    // Too many legitimate cases where the dep array is intentionally partial — revisit Phase B
    'react-hooks/exhaustive-deps': 'off',
  },
};
