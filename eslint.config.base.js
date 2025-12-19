import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import promisePlugin from 'eslint-plugin-promise'
import nPlugin from 'eslint-plugin-n'
import magikPlugin from './packages/eslint-plugin-magik/src/index.js'

export default tseslint.config(
  // ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript ESLint recommended rules
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Base configuration
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Bun globals
        Bun: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      promise: promisePlugin,
      n: nPlugin,
      '@magik': magikPlugin,
    },

    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          alwaysTryTypes: true,
        },
        node: true,
      },
    },

    rules: {
      // Function style - enforce function declarations for named exports
      'func-style': [
        'error',
        'declaration',
        {
          allowArrowFunctions: false,
        },
      ],

      // Type definitions - enforce type over interface
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // TypeScript specific
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',

      // Import rules
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@magik/'], // Handle workspace aliases
        },
      ],

      // Promise rules
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',

      // General code quality
      'no-console': 'off', // Allowed for backend/CLI
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Custom magik rules
      '@magik/exports-first': 'error',
    },
  },

  // Script files (less strict)
  {
    files: ['**/*.config.{js,ts}', '**/scripts/**/*.{js,ts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // Test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Generated files (from OpenAPI, etc.) - disable strict rules
  {
    files: ['**/*.gen.{ts,js}'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@magik/exports-first': 'off',
    },
  }
)
