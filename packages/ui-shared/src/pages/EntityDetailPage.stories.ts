import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import { VBtn, VAlert, VProgressCircular, VCard, VCardTitle, VCardText } from 'vuetify/components'
import EntityDetailPage from './EntityDetailPage.vue'
import SimpleBox from '../components/SimpleBox.vue'
import SectionedBox from '../components/SectionedBox.vue'
import BoxSection from '../components/BoxSection.vue'
import ListBox from '../components/ListBox.vue'

const meta = {
  title: 'Pages/EntityDetailPage',
  component: EntityDetailPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# EntityDetailPage

A layout component for entity detail views with a header, sidebar, and main content area.

## Overview

EntityDetailPage provides a consistent layout for detail/edit pages with:
- A header with breadcrumb-style navigation (title / subtitle)
- Clickable title for navigation back
- A 2-column layout with sidebar (2 cols) and main content (10 cols)

## Props

- \`title\`: Main page title (clickable, navigates to goBackUrl)
- \`subtitle\`: Subtitle shown after title with "/" separator
- \`goBackUrl\`: URL for navigation when clicking the title

## Slots

- \`sidebar\`: Left sidebar content (2 columns wide)
- \`default\`: Main content area (10 columns wide)
        `,
      },
    },
  },
} satisfies Meta<typeof EntityDetailPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Basic usage with title, subtitle, and goBackUrl props.
 */
export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The most basic usage with title/subtitle breadcrumb and a SimpleBox for main content.',
      },
    },
  },
  args: {
    title: 'Items',
    subtitle: 'Item Details',
    goBackUrl: '/',
  },
  render: (args) => ({
    components: { EntityDetailPage, SimpleBox },
    setup() {
      const content = ref('This is the main content area. It spans 10 columns by default.')
      return { args, content }
    },
    template: `
      <EntityDetailPage v-bind="args">
        <SimpleBox
          title="Main Content"
          :value="content"
          @update="content = $event"
        />
      </EntityDetailPage>
    `,
  }),
}

/**
 * Sidebar with SimpleBox and ListBox components for navigation and metadata.
 */
export const WithSidebar: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use the `sidebar` slot with SimpleBox and ListBox for navigation, metadata, or secondary content. The sidebar takes 2 columns while main content takes 10.',
      },
    },
  },
  args: {
    title: 'Items',
    subtitle: 'Item Details',
    goBackUrl: '/',
  },
  render: (args) => ({
    components: { EntityDetailPage, SimpleBox, ListBox, VCard, VCardTitle, VCardText },
    setup() {
      const mainContent = ref(
        'The main content area works alongside the sidebar. The sidebar is 2 columns and the main content is 10 columns.'
      )
      const metadata = ref('Created: Jan 15, 2024\nModified: Mar 10, 2024\nStatus: Active')
      const navItems = ref([
        { id: '1', name: 'Overview', icon: 'mdi-information' },
        { id: '2', name: 'Settings', icon: 'mdi-cog' },
        { id: '3', name: 'History', icon: 'mdi-history' },
      ])
      return { args, mainContent, metadata, navItems }
    },
    template: `
      <EntityDetailPage v-bind="args">
        <template #sidebar>
          <ListBox title="Navigation" class="mb-4" :editable="false">
            <VCard v-for="item in navItems" :key="item.id" variant="outlined" class="mb-2">
              <VCardTitle class="text-subtitle-2">{{ item.name }}</VCardTitle>
            </VCard>
          </ListBox>
          <SimpleBox
            title="Metadata"
            :value="metadata"
            :editable="false"
          />
        </template>
        <SimpleBox
          title="Main Content"
          :value="mainContent"
          @update="mainContent = $event"
        />
      </EntityDetailPage>
    `,
  }),
}

/**
 * Loading state example for async data fetching.
 */
export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Example of how to show a loading state while fetching data.',
      },
    },
  },
  args: {
    title: 'Items',
    subtitle: 'Loading...',
    goBackUrl: '/',
  },
  render: (args) => ({
    components: { EntityDetailPage, VProgressCircular },
    setup() {
      return { args }
    },
    template: `
      <EntityDetailPage v-bind="args">
        <div class="text-center py-8">
          <VProgressCircular indeterminate color="primary" size="64" />
          <p class="mt-4">Loading item details...</p>
        </div>
      </EntityDetailPage>
    `,
  }),
}

/**
 * Error state example for failed data fetching.
 */
export const ErrorState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Example of how to display an error state when data fetching fails.',
      },
    },
  },
  args: {
    title: 'Items',
    subtitle: 'Item Details',
    goBackUrl: '/',
  },
  render: (args) => ({
    components: { EntityDetailPage, VAlert, VBtn },
    setup() {
      return { args }
    },
    template: `
      <EntityDetailPage v-bind="args">
        <VAlert type="error" variant="tonal" class="mb-4">
          <div class="d-flex align-center">
            <div>
              <strong>Failed to load item</strong>
              <div>The requested item could not be found or the server is unavailable.</div>
            </div>
            <v-spacer />
            <VBtn variant="outlined" color="error" class="ml-4">
              Retry
            </VBtn>
          </div>
        </VAlert>
      </EntityDetailPage>
    `,
  }),
}

/**
 * Complete example combining all features using SimpleBox, SectionedBox, BoxSection, and ListBox.
 */
export const CompleteExample: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A full-featured example demonstrating all props and slots with Box components: title with subtitle and goBackUrl, sidebar with SimpleBox, ListBox, and SectionedBox, plus rich main content with action toolbar.',
      },
    },
  },
  args: {
    title: 'Decision Documents',
    subtitle: 'API Authentication Strategy',
    goBackUrl: '/',
  },
  render: (args) => ({
    components: {
      EntityDetailPage,
      VBtn,
      VAlert,
      VCard,
      VCardTitle,
      VCardText,
      SimpleBox,
      SectionedBox,
      BoxSection,
      ListBox,
    },
    setup() {
      const problemDefinition = ref(
        'We need to choose an authentication strategy for our new API that balances security, performance, and developer experience.'
      )
      const components = ref([
        { id: '1', name: 'API Gateway', description: 'Kong or AWS API Gateway' },
        { id: '2', name: 'Auth Service', description: 'Custom or Auth0' },
        { id: '3', name: 'Token Store', description: 'Redis cluster' },
      ])
      const useCases = ref([
        { id: '1', name: 'User login' },
        { id: '2', name: 'API access' },
        { id: '3', name: 'Service-to-service' },
      ])
      const proposalDescription = ref(
        'Use JWT with short-lived access tokens and refresh token rotation for optimal security.'
      )
      const proposalReasoning = ref(['Better scalability', 'Industry standard', 'Stateless verification'])

      const onAddComponent = () => alert('Add component')
      const onAddUseCase = () => alert('Add use case')

      return {
        args,
        problemDefinition,
        components,
        useCases,
        proposalDescription,
        proposalReasoning,
        onAddComponent,
        onAddUseCase,
      }
    },
    template: `
      <EntityDetailPage v-bind="args">
        <template #sidebar>
          <SimpleBox
            title="Problem Definition"
            class="mb-4"
            :value="problemDefinition"
            @update="problemDefinition = $event"
          />

          <ListBox title="Components" class="mb-4" @add="onAddComponent">
            <VCard v-for="item in components" :key="item.id" variant="outlined" class="mb-2">
              <VCardTitle class="text-subtitle-2">{{ item.name }}</VCardTitle>
              <VCardText class="text-caption">{{ item.description }}</VCardText>
            </VCard>
          </ListBox>

          <ListBox title="Use Cases" class="mb-4" @add="onAddUseCase">
            <VCard v-for="item in useCases" :key="item.id" variant="outlined" class="mb-2">
              <VCardTitle class="text-subtitle-2">{{ item.name }}</VCardTitle>
            </VCard>
          </ListBox>

          <SectionedBox title="Proposal">
            <BoxSection
              type="text"
              :value="proposalDescription"
              @update="proposalDescription = $event"
            />
            <BoxSection
              title="Reasoning"
              type="list"
              :items="proposalReasoning"
              @update="proposalReasoning = $event"
            />
          </SectionedBox>
        </template>

        <!-- Actions toolbar -->
        <div class="d-flex align-center mb-4">
          <VBtn variant="outlined" icon="mdi-pencil" class="mr-2" title="Edit" />
          <VBtn variant="outlined" icon="mdi-content-copy" class="mr-2" title="Copy URL" />
          <VBtn variant="outlined" icon="mdi-open-in-new" class="mr-2" title="Open in new tab" />
          <VBtn variant="outlined" prepend-icon="mdi-upload" class="mr-2">
            Push to Confluence
          </VBtn>
          <VBtn variant="outlined" prepend-icon="mdi-download">
            Pull from Confluence
          </VBtn>
        </div>

        <VAlert type="info" variant="tonal" class="mb-4">
          This decision document is linked to Confluence and will sync changes automatically.
        </VAlert>

        <SimpleBox title="Evaluation Matrix" :editable="false">
          <template #default>
            <p class="mb-4">Compare different authentication options against key decision drivers:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #ccc;">
                  <th style="text-align: left; padding: 8px;">Driver</th>
                  <th style="text-align: center; padding: 8px;">JWT</th>
                  <th style="text-align: center; padding: 8px;">OAuth2</th>
                  <th style="text-align: center; padding: 8px;">API Keys</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">Security</td>
                  <td style="text-align: center; padding: 8px;">4/5</td>
                  <td style="text-align: center; padding: 8px;">5/5</td>
                  <td style="text-align: center; padding: 8px;">2/5</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">Performance</td>
                  <td style="text-align: center; padding: 8px;">5/5</td>
                  <td style="text-align: center; padding: 8px;">3/5</td>
                  <td style="text-align: center; padding: 8px;">5/5</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">Developer Experience</td>
                  <td style="text-align: center; padding: 8px;">4/5</td>
                  <td style="text-align: center; padding: 8px;">3/5</td>
                  <td style="text-align: center; padding: 8px;">5/5</td>
                </tr>
                <tr>
                  <td style="padding: 8px;">Scalability</td>
                  <td style="text-align: center; padding: 8px;">5/5</td>
                  <td style="text-align: center; padding: 8px;">4/5</td>
                  <td style="text-align: center; padding: 8px;">3/5</td>
                </tr>
              </tbody>
            </table>
          </template>
        </SimpleBox>
      </EntityDetailPage>
    `,
  }),
}
