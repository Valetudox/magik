import baseConfig from '../../eslint.config.base.js'

export default [
  ...baseConfig,

  // eslint-plugin-magik specific configuration
  {
    files: ['**/*.{ts,js}'],
    rules: {
      // Allow unresolved imports for eslint types
      'import/no-unresolved': [
        'error',
        {
          ignore: ['^eslint$', '^@magik/'],
        },
      ],
    },
  },
]
