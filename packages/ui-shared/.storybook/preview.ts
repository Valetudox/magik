import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Create instances once as singletons
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

// Install once globally
setup((app) => {
  app.use(vuetify)
  app.use(router)
})

const preview: Preview = {
  decorators: [
    (story, context) => ({
      components: { story },
      setup() {
        const key = `${context.id}-${context.viewMode}`
        return { key }
      },
      template: `
        <v-app :key="key">
          <v-main>
            <story />
          </v-main>
        </v-app>
      `,
    }),
  ],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
}

export default preview
