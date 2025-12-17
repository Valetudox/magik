import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { h } from 'vue'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Create fresh instances for each app
setup((app) => {
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

  app.use(vuetify)
  app.use(router)
})

const preview: Preview = {
  decorators: [
    (story) => ({
      components: { story },
      template: '<v-app><v-main><story /></v-main></v-app>',
    }),
  ],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
}

export default preview
