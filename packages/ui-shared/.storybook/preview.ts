import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
})

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: { template: '<div></div>' } },
  ],
})

setup((app) => {
  app.use(vuetify)
  app.use(router)
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
}

export default preview
