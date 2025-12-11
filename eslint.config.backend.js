import baseConfig from './eslint.config.base.js'
import checkFile from 'eslint-plugin-check-file'

export default [
  ...baseConfig,
  {
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'no-inline-comments': 'error',
      'spaced-comment': ['error', 'never'],
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/src/actions/**/*.ts': '*.action',

          '**/src/services/**/*.ts': '+(*.service|index)',

          '**/src/utils/**/*.ts': 'KEBAB_CASE',

          '**/src/*.ts': '+(config|index|routes|types)',
        },
      ],

      'check-file/folder-naming-convention': [
        'error',
        {
          '**/src/**/': '+([a-z-]|\\[[a-zA-Z0-9]+\\])',
        },
      ],

      'check-file/folder-match-with-fex': [
        'error',
        {
          '*.{action,service}.ts': '**/src/{actions,services,utils}/**',
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts', 'apps/backend-*/src/**/*.ts'],
    ignores: ['src/config.ts', 'apps/backend-*/src/config.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Direct access to process.env is not allowed. Import configuration values from src/config.ts instead.',
        },
      ],
    },
  },
]
