import baseConfig from './eslint.config.base.js'
import checkFile from 'eslint-plugin-check-file'

export default [
  ...baseConfig,
  {
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      // Enforce naming conventions for backend files
      'check-file/filename-naming-convention': [
        'error',
        {
          // Files in src/actions must end with .action.ts or be index.ts
          '**/src/actions/**/*.ts': '+(*.action|index)',

          // Files in src/services must end with .service.ts or be index.ts
          '**/src/services/**/*.ts': '+(*.service|index)',

          // Files in src/utils can be kebab-case
          '**/src/utils/**/*.ts': 'KEBAB_CASE',

          // Root src files - only allow specific files
          '**/src/*.ts': '+(config|index|routes|types)',
        },
      ],

      // Enforce folder naming conventions
      'check-file/folder-naming-convention': [
        'error',
        {
          // All folders should use kebab-case
          '**/src/**/': 'KEBAB_CASE',
        },
      ],

      // Restrict which folders are allowed in src root
      // Files must be in allowed subdirectories OR be allowed root files
      'check-file/folder-match-with-fex': [
        'error',
        {
          // Files in subdirectories must be in actions, services, or utils
          '*.{action,service}.ts': '**/src/{actions,services,utils}/**',
        },
      ],
    },
  },
]
