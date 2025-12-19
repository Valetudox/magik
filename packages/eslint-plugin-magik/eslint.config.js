import eslint from '@eslint/js'

export default [
  // ESLint recommended rules only for this simple JS package
  eslint.configs.recommended,

  // eslint-plugin-magik specific configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Basic code quality
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
]
