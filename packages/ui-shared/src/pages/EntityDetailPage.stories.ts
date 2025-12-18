import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import { VBtn, VAlert, VCard, VCardTitle, VCardText } from 'vuetify/components'
import EntityDetailPage from './EntityDetailPage.vue'
import SimpleBox from '../components/SimpleBox.vue'
import SectionedBox from '../components/SectionedBox.vue'
import BoxSection from '../components/BoxSection.vue'
import ListBox from '../components/ListBox.vue'
import type { DetailPageConfig } from '../types/detail-page.schema'

// Mock data for stories
interface MockEntity {
  id: string
  name: string
  description: string
  status: string
}

const mockEntity: MockEntity = {
  id: 'item-123',
  name: 'Sample Item',
  description: 'This is a sample item for demonstration purposes.',
  status: 'Active',
}

const createMockConfig = (overrides: Partial<DetailPageConfig> = {}): DetailPageConfig => ({
  pageTitle: 'Items',
  goBackUrl: '/',
  entityId: 'item-123',
  getEntity: async () => mockEntity,
  getSubtitle: (entity: MockEntity) => entity.name,
  onLoad: () => {},
  ...overrides,
})

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
- Automatic loading and error states
- Optional agent input for AI assistance
- Socket.IO integration for real-time updates

## Config Props

- \`pageTitle\`: Main page title (shown in breadcrumbs)
- \`goBackUrl\`: URL for navigation when clicking the title
- \`entityId\`: ID of the entity to load
- \`getEntity\`: Async function to fetch the entity
- \`getSubtitle\`: Function to generate subtitle from entity data
- \`onLoad\`: Callback when entity is loaded or updated
- \`socket\`: Optional socket configuration for real-time updates
- \`agent\`: Optional agent input configuration

## Slots

- \`sidebar\`: Left sidebar content (2 columns wide)
- \`default\`: Main content area (10 columns wide)
- \`title-actions\`: Action buttons in the header
        `,
      },
    },
  },
} satisfies Meta<typeof EntityDetailPage>

export default meta
type Story = StoryObj<typeof meta> & { args?: unknown }

/**
 * Basic usage with config prop.
 */
export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The most basic usage with config and a SimpleBox for main content.',
      },
    },
  },
  render: () => ({
    components: { EntityDetailPage, SimpleBox },
    setup() {
      const entity = ref<MockEntity | null>(null)
      const config = createMockConfig({
        onLoad: (e: MockEntity) => {
          entity.value = e
        },
      })
      return { config, entity }
    },
    template: `
      <EntityDetailPage :config="config">
        <SimpleBox
          v-if="entity"
          title="Main Content"
          :value="entity.description"
          :editable="false"
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
  render: () => ({
    components: { EntityDetailPage, SimpleBox, ListBox, VCard, VCardTitle, VCardText },
    setup() {
      const entity = ref<MockEntity | null>(null)
      const config = createMockConfig({
        onLoad: (e: MockEntity) => {
          entity.value = e
        },
      })
      const navItems = ref([
        { id: '1', name: 'Overview', icon: 'mdi-information' },
        { id: '2', name: 'Settings', icon: 'mdi-cog' },
        { id: '3', name: 'History', icon: 'mdi-history' },
      ])
      return { config, entity, navItems }
    },
    template: `
      <EntityDetailPage :config="config">
        <template #sidebar>
          <ListBox title="Navigation" class="mb-4" :editable="false">
            <VCard v-for="item in navItems" :key="item.id" variant="outlined" class="mb-2">
              <VCardTitle class="text-subtitle-2">{{ item.name }}</VCardTitle>
            </VCard>
          </ListBox>
          <SimpleBox
            v-if="entity"
            title="Metadata"
            :value="'Status: ' + entity.status"
            :editable="false"
          />
        </template>
        <SimpleBox
          v-if="entity"
          title="Main Content"
          :value="entity.description"
          :editable="false"
        />
      </EntityDetailPage>
    `,
  }),
}

/**
 * Loading state is automatically shown while getEntity is pending.
 */
export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Loading state is automatically shown while the getEntity function is pending.',
      },
    },
  },
  render: () => ({
    components: { EntityDetailPage },
    setup() {
      const config = createMockConfig({
        // Simulate slow loading
        getEntity: () => new Promise(() => {}), // Never resolves
      })
      return { config }
    },
    template: `
      <EntityDetailPage :config="config">
        <div>This content won't be shown while loading.</div>
      </EntityDetailPage>
    `,
  }),
}

/**
 * Error state is automatically shown when getEntity fails.
 */
export const ErrorState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Error state is automatically shown when the getEntity function throws an error.',
      },
    },
  },
  render: () => ({
    components: { EntityDetailPage },
    setup() {
      const config = createMockConfig({
        getEntity: async () => {
          throw new Error('Failed to load')
        },
      })
      return { config }
    },
    template: `
      <EntityDetailPage :config="config">
        <div>This content won't be shown when there's an error.</div>
      </EntityDetailPage>
    `,
  }),
}

/**
 * With agent input enabled for AI assistance.
 */
export const WithAgentInput: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Enable the agent input to allow users to interact with AI for assistance.',
      },
    },
  },
  render: () => ({
    components: { EntityDetailPage, SimpleBox },
    setup() {
      const entity = ref<MockEntity | null>(null)
      const config = createMockConfig({
        onLoad: (e: MockEntity) => {
          entity.value = e
        },
        agent: {
          enabled: true,
          placeholder: 'Ask the AI to help...',
          onSubmit: async (prompt: string) => {
            console.log('Agent prompt:', prompt)
            await new Promise((resolve) => setTimeout(resolve, 1000))
          },
        },
      })
      return { config, entity }
    },
    template: `
      <EntityDetailPage :config="config">
        <SimpleBox
          v-if="entity"
          title="Main Content"
          :value="entity.description"
          :editable="false"
        />
      </EntityDetailPage>
    `,
  }),
}

/**
 * Complete example combining all features.
 */
export const CompleteExample: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A full-featured example demonstrating all props and slots with Box components.',
      },
    },
  },
  render: () => ({
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
      const entity = ref<MockEntity | null>(null)
      const config = createMockConfig({
        pageTitle: 'Decision Documents',
        getSubtitle: () => 'API Authentication Strategy',
        onLoad: (e: MockEntity) => {
          entity.value = e
        },
        agent: {
          enabled: true,
          placeholder: 'Ask the AI to modify this decision...',
          onSubmit: async (prompt: string) => {
            console.log('Agent prompt:', prompt)
          },
        },
      })

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
        config,
        entity,
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
      <EntityDetailPage :config="config">
        <template #title-actions>
          <div class="d-flex ga-2">
            <VBtn variant="outlined" prepend-icon="mdi-pencil" size="small">Edit URL</VBtn>
            <VBtn variant="outlined" prepend-icon="mdi-content-copy" size="small">Copy</VBtn>
            <VBtn variant="outlined" prepend-icon="mdi-open-in-new" size="small">Open</VBtn>
            <VBtn variant="outlined" prepend-icon="mdi-upload" size="small">Push</VBtn>
            <VBtn variant="outlined" prepend-icon="mdi-download" size="small">Pull</VBtn>
          </div>
        </template>

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
