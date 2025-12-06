import baseConfig from '../../eslint.config.base.js'

export default [
  ...baseConfig,

  // Agents-specific configuration
  {
    files: ['**/*.{ts,js}'],
    rules: {
      // Ignore unresolved imports for external packages
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^@ai-sdk/', '^ai$', '^zod$', '^glob$', '^@magik/'],
        },
      ],
    },
  },

  // Zod schema files have legitimate dynamic typing
  {
    files: ['**/interface.types.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
]
