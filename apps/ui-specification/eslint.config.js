import baseConfig from '../../eslint.config.base.js'
import vueConfig from '../../eslint.config.vue.js'

export default [
  ...baseConfig,
  ...vueConfig,
  // ui-specification specific overrides
  {
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      globals: {
        console: 'readonly',
      },
    },
    rules: {
      // Disable unsafe rules for Vue/Vuetify which don't have proper types
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'no-undef': 'off', // TypeScript handles this better
      'import/no-unresolved': ['error', {
        ignore: [
          '^vue$',
          '^vuetify',
          '^@mdi/',
          '^vue-router$',
        ],
      }],
    },
  },
]
