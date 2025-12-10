import baseConfig from '../../eslint.config.base.js'
import vueConfig from '../../eslint.config.vue.js'

export default [
  ...baseConfig,
  ...vueConfig,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        alert: 'readonly',
      },
    },
  },
]
