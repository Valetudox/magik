import baseConfig from './eslint.config.base.js'
import vueConfig from './eslint.config.vue.js'
import prettier from 'eslint-config-prettier'

export default [
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.venv/**',
      '**/python/**',
      '**/dags/**',
      '**/coverage/**',
      '**/.git/**',
      '**/generated/**',
      '**/backend-audio-client/**', // Generated client
      '**/backend-socket-client/**', // Generated client
      'apps/gateway/**', // Nginx only
    ],
  },

  // Base TypeScript config for all TS files
  ...baseConfig,

  // Vue-specific config for .vue files
  ...vueConfig,

  // Prettier config - disables ESLint rules that conflict with Prettier
  prettier,

  // Package-specific overrides
  {
    files: ['packages/audio/**/*.{js,ts}'],
    rules: {
      // This package is mostly shell scripts
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]
