import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import EntityDetailTable from './EntityDetailTable.vue'
import type { DetailTableConfigInput } from '../types/detail-table.schema'

const meta = {
  title: 'Components/EntityDetailTable',
  component: EntityDetailTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# EntityDetailTable

A config-driven table component for detail pages. Supports multiple cell types and optional rating decorators.

## Features

- **Config-driven**: Define columns via configuration object
- **Type-safe**: Uses Zod schemas with discriminated unions
- **Rating decorator**: Add rating bar to any cell type
- **Editable**: Double-click to edit cells

## Cell Types

| Type | Description | Edit Dialog |
|------|-------------|-------------|
| \`text\` | Simple text | TextEditDialog |
| \`list\` | Array of strings | ListEditDialog |
| \`mermaid\` | Mermaid diagram | MermaidEditDialog (side-by-side editor + preview) |
| \`custom\` | Custom slot | User-defined |

## Rating Decorator

Any cell can have a rating bar by adding the \`rating\` property:

\`\`\`ts
{
  type: 'list',
  key: 'details',
  header: 'Option A',
  rating: {
    key: 'ratingValue',
    levels: [
      { key: 'high', label: 'High', color: 'success' },
      { key: 'medium', label: 'Medium', color: 'warning' },
      { key: 'low', label: 'Low', color: 'error' },
    ],
  }
}
\`\`\`

## Header Badges

Add visual badges to column headers with \`headerBadges\` (array):

\`\`\`ts
{
  type: 'text',
  key: 'option-a',
  header: 'Option A',
  headerBadges: [
    { label: 'Selected', color: 'success', icon: 'mdi-check-circle' },
    { label: 'Best Value', color: 'info' },
  ],
}
\`\`\`
        `,
      },
    },
  },
} satisfies Meta<typeof EntityDetailTable>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Basic table with text columns.
 */
export const BasicTextTable: Story = {
  args: {
    config: {
      rowKey: 'id',
      rowHeader: { key: 'name', header: 'Name', width: '150px' },
      columns: [
        { type: 'text', key: 'description', header: 'Description' },
        { type: 'text', key: 'status', header: 'Status' },
      ],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const config: DetailTableConfigInput = {
        rowKey: 'id',
        rowHeader: { key: 'name', header: 'Name', width: '150px' },
        columns: [
          { type: 'text', key: 'description', header: 'Description' },
          { type: 'text', key: 'status', header: 'Status' },
        ],
      }
      const rows = ref([
        { id: '1', name: 'Feature A', description: 'Implements user authentication', status: 'Active' },
        { id: '2', name: 'Feature B', description: 'Adds payment processing', status: 'Draft' },
        { id: '3', name: 'Feature C', description: 'Dashboard analytics', status: 'Active' },
      ])
      const handleUpdate = (payload: { rowKey: string; columnKey: string; value: unknown }) => {
        console.log('Cell updated:', payload)
        const row = rows.value.find((r) => r.id === payload.rowKey)
        if (row) {
          ;(row as Record<string, unknown>)[payload.columnKey] = payload.value
        }
      }
      return { config, rows, handleUpdate }
    },
    template: `
      <EntityDetailTable
        :config="config"
        :rows="rows"
        @update:cell="handleUpdate"
      >
        <template #title>
          <v-card-title>Basic Text Table</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Table with list columns showing array data.
 */
export const ListColumns: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const config: DetailTableConfigInput = {
        rowKey: 'id',
        rowHeader: { key: 'name', header: 'Use Case', width: '180px' },
        columns: [
          { type: 'text', key: 'description', header: 'Description' },
          { type: 'list', key: 'steps', header: 'Steps' },
          { type: 'list', key: 'notes', header: 'Notes' },
        ],
      }
      const rows = ref([
        {
          id: '1',
          name: 'User Login',
          description: 'Standard authentication flow',
          steps: ['Enter credentials', 'Validate password', 'Generate token', 'Redirect to dashboard'],
          notes: ['Supports SSO', 'Rate limited to 5 attempts'],
        },
        {
          id: '2',
          name: 'Data Export',
          description: 'Export user data to CSV',
          steps: ['Select date range', 'Choose fields', 'Generate file', 'Download'],
          notes: ['Max 10,000 rows', 'Async for large exports'],
        },
      ])
      const handleUpdate = (payload: { rowKey: string; columnKey: string; value: unknown }) => {
        console.log('Cell updated:', payload)
      }
      return { config, rows, handleUpdate }
    },
    template: `
      <EntityDetailTable
        :config="config"
        :rows="rows"
        @update:cell="handleUpdate"
      >
        <template #title>
          <v-card-title>Use Case Details</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Evaluation matrix with ratings - like the Decision Document use case.
 * Each cell has a rating bar on the left + list content.
 */
export const EvaluationMatrix: Story = {
  args: {
    config: {
      rowKey: 'driverId',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const ratingLevels = [
        { key: 'high', label: 'High', color: 'success' },
        { key: 'medium', label: 'Medium', color: 'warning' },
        { key: 'low', label: 'Low', color: 'error' },
      ]

      const config: DetailTableConfigInput = {
        rowKey: 'driverId',
        rowHeader: { key: 'driverName', header: 'Decision Drivers', width: '200px' },
        columns: [
          {
            type: 'list',
            key: 'details-opt-1',
            header: 'Option A',
            rating: { key: 'rating-opt-1', levels: ratingLevels },
          },
          {
            type: 'list',
            key: 'details-opt-2',
            header: 'Option B',
            rating: { key: 'rating-opt-2', levels: ratingLevels },
          },
          {
            type: 'list',
            key: 'details-opt-3',
            header: 'Option C',
            rating: { key: 'rating-opt-3', levels: ratingLevels },
          },
        ],
      }

      const rows = ref([
        {
          driverId: 'drv-1',
          driverName: 'Performance',
          'rating-opt-1': 'high',
          'details-opt-1': ['Fast response times', 'Scales well'],
          'rating-opt-2': 'medium',
          'details-opt-2': ['Acceptable latency', 'May need optimization'],
          'rating-opt-3': 'low',
          'details-opt-3': ['Slow under load', 'Known bottlenecks'],
        },
        {
          driverId: 'drv-2',
          driverName: 'Cost',
          'rating-opt-1': 'low',
          'details-opt-1': ['Expensive licensing', 'High infrastructure cost'],
          'rating-opt-2': 'high',
          'details-opt-2': ['Open source', 'Minimal infrastructure'],
          'rating-opt-3': 'medium',
          'details-opt-3': ['Moderate licensing', 'Standard infrastructure'],
        },
        {
          driverId: 'drv-3',
          driverName: 'Scalability',
          'rating-opt-1': 'high',
          'details-opt-1': ['Horizontal scaling', 'Auto-scaling support'],
          'rating-opt-2': 'high',
          'details-opt-2': ['Cloud-native', 'Elastic scaling'],
          'rating-opt-3': null,
          'details-opt-3': [],
        },
      ])

      const handleUpdate = (payload: { rowKey: string; columnKey: string; value: unknown }) => {
        console.log('Updated:', payload)
        const row = rows.value.find((r) => r.driverId === payload.rowKey)
        if (row) {
          ;(row as Record<string, unknown>)[payload.columnKey] = payload.value
        }
      }

      return { config, rows, handleUpdate }
    },
    template: `
      <EntityDetailTable
        :config="config"
        :rows="rows"
        @update:cell="handleUpdate"
      >
        <template #title>
          <v-card-title>Evaluation Matrix</v-card-title>
        </template>
        <template #footer>
          <v-card-text>
            <div class="d-flex gap-4 text-caption">
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-success))" class="mr-1"></span> High - Good fit</span>
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-warning))" class="mr-1"></span> Medium - Acceptable</span>
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-error))" class="mr-1"></span> Low - Concerns</span>
            </div>
          </v-card-text>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Text cells with custom priority ratings (non-standard colors).
 */
export const CustomRatings: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const priorityLevels = [
        { key: 'critical', label: 'Critical', color: '#d32f2f', icon: 'mdi-alert-circle' },
        { key: 'high', label: 'High', color: '#f57c00', icon: 'mdi-arrow-up-bold' },
        { key: 'medium', label: 'Medium', color: '#fbc02d', icon: 'mdi-minus' },
        { key: 'low', label: 'Low', color: '#388e3c', icon: 'mdi-arrow-down-bold' },
      ]

      const effortLevels = [
        { key: 'xl', label: 'XL', color: '#7b1fa2' },
        { key: 'l', label: 'L', color: '#1976d2' },
        { key: 'm', label: 'M', color: '#388e3c' },
        { key: 's', label: 'S', color: '#fbc02d' },
      ]

      const config: DetailTableConfigInput = {
        rowKey: 'id',
        rowHeader: { key: 'task', header: 'Task', width: '200px' },
        columns: [
          {
            type: 'text',
            key: 'description',
            header: 'Description',
            rating: { key: 'priority', levels: priorityLevels, allowEmpty: false },
          },
          {
            type: 'text',
            key: 'notes',
            header: 'Notes',
            rating: { key: 'effort', levels: effortLevels, emptyLabel: 'Not estimated' },
          },
        ],
      }

      const rows = ref([
        { id: '1', task: 'Fix login bug', description: 'Users cannot log in', priority: 'critical', notes: 'Needs immediate attention', effort: 's' },
        { id: '2', task: 'Add dark mode', description: 'Theme support', priority: 'medium', notes: 'Design ready', effort: 'l' },
        { id: '3', task: 'Refactor API', description: 'Improve architecture', priority: 'low', notes: 'Tech debt cleanup', effort: 'xl' },
      ])

      const handleUpdate = (payload: { rowKey: string; columnKey: string; value: unknown }) => {
        console.log('Updated:', payload)
      }

      return { config, rows, handleUpdate }
    },
    template: `
      <EntityDetailTable
        :config="config"
        :rows="rows"
        @update:cell="handleUpdate"
      >
        <template #title>
          <v-card-title>Tasks with Priority & Effort</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Empty state with custom message.
 */
export const EmptyState: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [
        { type: 'text', key: 'name', header: 'Name' },
        { type: 'text', key: 'value', header: 'Value' },
      ],
      emptyText: 'No data available. Add some items to get started.',
    } as DetailTableConfigInput,
    rows: [],
  },
  render: (args) => ({
    components: { EntityDetailTable },
    setup: () => ({ args }),
    template: `
      <EntityDetailTable :config="args.config" :rows="args.rows">
        <template #title>
          <v-card-title>Empty Table</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Read-only mode (editable: false).
 */
export const ReadOnly: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const config: DetailTableConfigInput = {
        rowKey: 'id',
        rowHeader: { key: 'name', header: 'Item', width: '150px' },
        columns: [
          { type: 'text', key: 'description', header: 'Description' },
          { type: 'list', key: 'tags', header: 'Tags' },
        ],
        editable: false,
      }
      const rows = [
        { id: '1', name: 'Item A', description: 'Read-only content', tags: ['tag1', 'tag2'] },
        { id: '2', name: 'Item B', description: 'Cannot edit', tags: ['tag3'] },
      ]
      return { config, rows }
    },
    template: `
      <EntityDetailTable :config="config" :rows="rows">
        <template #title>
          <v-card-title>Read-Only Table</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Editable table - double-click any cell to edit.
 * Demonstrates text, list, and mermaid cell editing.
 */
export const Editable: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const config: DetailTableConfigInput = {
        rowKey: 'id',
        editable: true,
        rowHeader: { key: 'name', header: 'Service', width: '150px' },
        columns: [
          { type: 'text', key: 'description', header: 'Description' },
          { type: 'list', key: 'features', header: 'Features' },
          { type: 'mermaid', key: 'diagram', header: 'Architecture' },
        ],
      }
      const rows = ref([
        {
          id: '1',
          name: 'API Gateway',
          description: 'Handles all incoming requests and routes them to appropriate services',
          features: ['Rate limiting', 'Authentication', 'Load balancing'],
          diagram: 'graph LR\n  Client --> Gateway\n  Gateway --> ServiceA\n  Gateway --> ServiceB',
        },
        {
          id: '2',
          name: 'User Service',
          description: 'Manages user accounts and profiles',
          features: ['Registration', 'Profile management', 'Password reset'],
          diagram: 'graph TD\n  API[API Layer] --> BL[Business Logic]\n  BL --> DB[(Database)]',
        },
      ])

      const handleUpdate = (payload: { rowKey: string; columnKey: string; value: unknown }) => {
        console.log('Cell updated:', payload)
        const row = rows.value.find((r) => r.id === payload.rowKey)
        if (row) {
          ;(row as Record<string, unknown>)[payload.columnKey] = payload.value
        }
      }

      return { config, rows, handleUpdate }
    },
    template: `
      <EntityDetailTable
        :config="config"
        :rows="rows"
        @update:cell="handleUpdate"
      >
        <template #title>
          <v-card-title>Services (double-click to edit any cell)</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Rating editing - click the colored bar on the left to change ratings.
 */
export const EditableRatings: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const ratingLevels = [
        { key: 'high', label: 'High', color: 'success' },
        { key: 'medium', label: 'Medium', color: 'warning' },
        { key: 'low', label: 'Low', color: 'error' },
      ]

      const config: DetailTableConfigInput = {
        rowKey: 'id',
        editable: true,
        rowHeader: { key: 'task', header: 'Task', width: '180px' },
        columns: [
          {
            type: 'text',
            key: 'description',
            header: 'Description',
            rating: { key: 'priority', levels: ratingLevels },
          },
          {
            type: 'list',
            key: 'blockers',
            header: 'Blockers',
            rating: { key: 'risk', levels: ratingLevels, allowEmpty: true, emptyLabel: 'Not assessed' },
          },
        ],
      }

      const rows = ref([
        {
          id: '1',
          task: 'Database migration',
          description: 'Migrate from MySQL to PostgreSQL',
          priority: 'high',
          blockers: ['Schema differences', 'Data validation'],
          risk: 'medium',
        },
        {
          id: '2',
          task: 'API refactor',
          description: 'Update REST endpoints to v2',
          priority: 'medium',
          blockers: ['Breaking changes'],
          risk: 'low',
        },
        {
          id: '3',
          task: 'Documentation',
          description: 'Update API docs',
          priority: 'low',
          blockers: [],
          risk: null, // Not assessed
        },
      ])

      const handleCellUpdate = (payload: { rowKey: string; columnKey: string; value: unknown }) => {
        console.log('Cell updated:', payload)
        const row = rows.value.find((r) => r.id === payload.rowKey)
        if (row) {
          ;(row as Record<string, unknown>)[payload.columnKey] = payload.value
        }
      }

      const handleRatingUpdate = (payload: { rowKey: string; ratingKey: string; value: string | null }) => {
        console.log('Rating updated:', payload)
        const row = rows.value.find((r) => r.id === payload.rowKey)
        if (row) {
          ;(row as Record<string, unknown>)[payload.ratingKey] = payload.value
        }
      }

      return { config, rows, handleCellUpdate, handleRatingUpdate }
    },
    template: `
      <EntityDetailTable
        :config="config"
        :rows="rows"
        @update:cell="handleCellUpdate"
        @update:rating="handleRatingUpdate"
      >
        <template #title>
          <v-card-title>Tasks (click colored bar to change rating)</v-card-title>
        </template>
        <template #footer>
          <v-card-text>
            <div class="d-flex gap-4 text-caption">
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-success))" class="mr-1"></span> High priority</span>
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-warning))" class="mr-1"></span> Medium priority</span>
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-error))" class="mr-1"></span> Low priority</span>
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgba(128,128,128,0.2)" class="mr-1"></span> Not assessed</span>
            </div>
          </v-card-text>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Column header badges - visual indicators on column headers.
 */
export const WithBadges: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const config: DetailTableConfigInput = {
        rowKey: 'id',
        rowHeader: { key: 'criteria', header: 'Criteria', width: '150px' },
        columns: [
          {
            type: 'text',
            key: 'option-a',
            header: 'Option A',
            headerBadges: [
              { label: 'Selected', color: 'success', icon: 'mdi-check-circle' },
              { label: 'Best Value', color: 'info' },
            ],
          },
          {
            type: 'text',
            key: 'option-b',
            header: 'Option B',
            headerBadges: [{ label: 'Runner-up', color: 'warning' }],
          },
          {
            type: 'text',
            key: 'option-c',
            header: 'Option C',
            // No badges
          },
        ],
      }
      const rows = [
        { id: '1', criteria: 'Cost', 'option-a': '$100/mo', 'option-b': '$150/mo', 'option-c': '$200/mo' },
        { id: '2', criteria: 'Support', 'option-a': '24/7', 'option-b': 'Business hours', 'option-c': 'Email only' },
        { id: '3', criteria: 'Features', 'option-a': 'Full', 'option-b': 'Standard', 'option-c': 'Basic' },
      ]
      return { config, rows }
    },
    template: `
      <EntityDetailTable :config="config" :rows="rows">
        <template #title>
          <v-card-title>Options Comparison (with header badges)</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Row headers with tooltips - hover over row names to see descriptions.
 */
export const WithTooltips: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const config: DetailTableConfigInput = {
        rowKey: 'id',
        rowHeader: {
          key: 'name',
          header: 'Feature',
          width: '180px',
          tooltip: 'description', // Field to use for tooltip content
        },
        columns: [
          { type: 'text', key: 'status', header: 'Status' },
          { type: 'text', key: 'owner', header: 'Owner' },
        ],
      }
      const rows = [
        {
          id: '1',
          name: 'Authentication',
          description: 'Handles user login, logout, and session management with JWT tokens',
          status: 'Active',
          owner: 'Security Team',
        },
        {
          id: '2',
          name: 'Caching',
          description: 'Redis-based caching layer for improved performance on read-heavy operations',
          status: 'Active',
          owner: 'Platform Team',
        },
        {
          id: '3',
          name: 'Rate Limiting',
          description: 'Prevents abuse by limiting API requests per user/IP within a time window',
          status: 'Beta',
          owner: 'API Team',
        },
      ]
      return { config, rows }
    },
    template: `
      <EntityDetailTable :config="config" :rows="rows">
        <template #title>
          <v-card-title>Features (hover row names for details)</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Loading state.
 */
export const Loading: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [
        { type: 'text', key: 'name', header: 'Name' },
      ],
    } as DetailTableConfigInput,
    rows: [],
    loading: true,
  },
  render: (args) => ({
    components: { EntityDetailTable },
    setup: () => ({ args }),
    template: `
      <EntityDetailTable :config="args.config" :rows="args.rows" :loading="args.loading">
        <template #title>
          <v-card-title>Loading...</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Full-featured example with header menus, badges, tooltips, and special rows.
 * Demonstrates all new features similar to DecisionDetail evaluation matrix.
 */
export const FullFeatured: Story = {
  args: {
    config: {
      rowKey: 'driverId',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const selectedOption = ref<string | null>('opt-1')

      const ratingLevels = [
        { key: 'high', label: 'High', color: 'success' },
        { key: 'medium', label: 'Medium', color: 'warning' },
        { key: 'low', label: 'Low', color: 'error' },
      ]

      const driverMenuItems = [
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
        { key: 'delete', icon: 'mdi-delete', title: 'Delete', class: 'text-error' },
      ]

      const getOptionMenuItems = (optKey: string) => {
        const isSelected = selectedOption.value === optKey
        return [
          isSelected
            ? { key: 'clearSelection', icon: 'mdi-close-circle-outline', title: 'Clear selection' }
            : { key: 'select', icon: 'mdi-check-circle-outline', title: 'Select' },
          { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
          { key: 'delete', icon: 'mdi-delete', title: 'Delete', class: 'text-error' },
        ]
      }

      const config = ref<DetailTableConfigInput>({
        rowKey: 'driverId',
        rowHeader: {
          key: 'driverName',
          header: 'Decision Drivers',
          width: '200px',
          tooltip: 'driverDescription',
          menu: driverMenuItems,
        },
        specialRows: [
          { key: 'description', header: 'Description', type: 'text', fieldKey: 'description' },
        ],
        columns: [
          {
            type: 'list',
            key: 'details-opt-1',
            header: 'Option A',
            headerMenu: getOptionMenuItems('opt-1'),
            headerBadges: selectedOption.value === 'opt-1'
              ? [{ label: 'Selected', color: 'success', icon: 'mdi-check-circle' }]
              : undefined,
            rating: { key: 'rating-opt-1', levels: ratingLevels },
          },
          {
            type: 'list',
            key: 'details-opt-2',
            header: 'Option B',
            headerMenu: getOptionMenuItems('opt-2'),
            headerBadges: selectedOption.value === 'opt-2'
              ? [{ label: 'Selected', color: 'success', icon: 'mdi-check-circle' }]
              : undefined,
            rating: { key: 'rating-opt-2', levels: ratingLevels },
          },
          {
            type: 'list',
            key: 'details-opt-3',
            header: 'Option C',
            headerMenu: getOptionMenuItems('opt-3'),
            headerBadges: selectedOption.value === 'opt-3'
              ? [{ label: 'Selected', color: 'success', icon: 'mdi-check-circle' }]
              : undefined,
            rating: { key: 'rating-opt-3', levels: ratingLevels },
          },
        ],
      })

      // Column data for special rows
      const columnData = ref({
        'details-opt-1': { description: 'Uses microservices architecture with event sourcing' },
        'details-opt-2': { description: 'Monolithic approach with modular design' },
        'details-opt-3': { description: 'Serverless functions with managed services' },
      })

      const rows = ref([
        {
          driverId: 'drv-1',
          driverName: 'Performance',
          driverDescription: 'How well does the option perform under load?',
          'rating-opt-1': 'high',
          'details-opt-1': ['Fast response times', 'Horizontal scaling'],
          'rating-opt-2': 'medium',
          'details-opt-2': ['Acceptable latency', 'Vertical scaling only'],
          'rating-opt-3': 'high',
          'details-opt-3': ['Auto-scaling', 'Pay per use'],
        },
        {
          driverId: 'drv-2',
          driverName: 'Cost',
          driverDescription: 'Total cost of ownership including licensing and infrastructure',
          'rating-opt-1': 'low',
          'details-opt-1': ['Complex infrastructure', 'High operational cost'],
          'rating-opt-2': 'high',
          'details-opt-2': ['Simple deployment', 'Low maintenance'],
          'rating-opt-3': 'medium',
          'details-opt-3': ['Variable costs', 'Can spike unexpectedly'],
        },
        {
          driverId: 'drv-3',
          driverName: 'Team Expertise',
          driverDescription: 'Does the team have experience with this approach?',
          'rating-opt-1': 'medium',
          'details-opt-1': ['Some experience', 'Training needed'],
          'rating-opt-2': 'high',
          'details-opt-2': ['Well understood', 'Proven patterns'],
          'rating-opt-3': 'low',
          'details-opt-3': ['New technology', 'Steep learning curve'],
        },
      ])

      const handleCellUpdate = (payload: { rowKey: string; columnKey: string; value: unknown }) => {
        console.log('Cell updated:', payload)
      }

      const handleEditAi = (payload: { rowKey: string; columnKey: string }) => {
        console.log('Edit with AI:', payload)
        alert(`Edit with AI: ${payload.rowKey} / ${payload.columnKey}`)
      }

      const handleRowHeaderMenu = (payload: { rowKey: string; menuKey: string; row: Record<string, unknown> }) => {
        console.log('Row header menu:', payload)
        alert(`Driver menu: ${payload.menuKey} on ${payload.row.driverName}`)
      }

      const handleColumnHeaderMenu = (payload: { columnKey: string; menuKey: string }) => {
        console.log('Column header menu:', payload)
        if (payload.menuKey === 'select') {
          const optKey = payload.columnKey.replace('details-', '')
          selectedOption.value = optKey
          // Update config to reflect new selection
          updateConfigBadges()
        } else if (payload.menuKey === 'clearSelection') {
          selectedOption.value = null
          updateConfigBadges()
        } else {
          alert(`Option menu: ${payload.menuKey} on ${payload.columnKey}`)
        }
      }

      const updateConfigBadges = () => {
        config.value = {
          ...config.value,
          columns: config.value.columns.map((col) => {
            const optKey = col.key.replace('details-', '')
            return {
              ...col,
              headerMenu: getOptionMenuItems(optKey),
              headerBadges: selectedOption.value === optKey
                ? [{ label: 'Selected', color: 'success', icon: 'mdi-check-circle' }]
                : undefined,
            }
          }),
        }
      }

      const handleSpecialRowUpdate = (payload: { specialRowKey: string; columnKey: string; value: unknown }) => {
        console.log('Special row updated:', payload)
      }

      const handleSpecialRowEditAi = (payload: { specialRowKey: string; columnKey: string }) => {
        console.log('Special row edit AI:', payload)
        alert(`Edit special row with AI: ${payload.specialRowKey} / ${payload.columnKey}`)
      }

      return {
        config,
        rows,
        columnData,
        handleCellUpdate,
        handleEditAi,
        handleRowHeaderMenu,
        handleColumnHeaderMenu,
        handleSpecialRowUpdate,
        handleSpecialRowEditAi,
      }
    },
    template: `
      <EntityDetailTable
        :config="config"
        :rows="rows"
        :column-data="columnData"
        @update:cell="handleCellUpdate"
        @edit-ai="handleEditAi"
        @row-header:menu="handleRowHeaderMenu"
        @column-header:menu="handleColumnHeaderMenu"
        @update:special-row="handleSpecialRowUpdate"
        @edit-ai:special-row="handleSpecialRowEditAi"
      >
        <template #title>
          <v-card-title class="d-flex align-center">
            <span>Full-Featured Evaluation Matrix</span>
            <v-spacer />
            <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-plus" class="mr-2">
              Add Option
            </v-btn>
            <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-plus">
              Add Driver
            </v-btn>
          </v-card-title>
        </template>
        <template #footer>
          <v-card-text>
            <div class="d-flex gap-4 text-caption">
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-success))" class="mr-1"></span> High - Good fit</span>
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-warning))" class="mr-1"></span> Medium - Acceptable</span>
              <span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:rgb(var(--v-theme-error))" class="mr-1"></span> Low - Concerns</span>
            </div>
          </v-card-text>
        </template>
      </EntityDetailTable>
    `,
  }),
}

/**
 * Table with special rows (description and diagram rows before data).
 */
export const WithSpecialRows: Story = {
  args: {
    config: {
      rowKey: 'id',
      columns: [],
    } as DetailTableConfigInput,
    rows: [],
  },
  render: () => ({
    components: { EntityDetailTable },
    setup: () => {
      const config: DetailTableConfigInput = {
        rowKey: 'id',
        rowHeader: { key: 'name', header: 'Criteria', width: '180px' },
        specialRows: [
          { key: 'summary', header: 'Summary', type: 'text', fieldKey: 'summary' },
          { key: 'diagram', header: 'Architecture', type: 'mermaid', fieldKey: 'diagram' },
        ],
        columns: [
          { type: 'list', key: 'product-a', header: 'Product A' },
          { type: 'list', key: 'product-b', header: 'Product B' },
        ],
      }

      const columnData = ref({
        'product-a': {
          summary: 'Enterprise solution with comprehensive features',
          diagram: 'graph TD\n  A[Client] --> B[Load Balancer]\n  B --> C[App Server]\n  C --> D[Database]',
        },
        'product-b': {
          summary: 'Lightweight alternative focused on simplicity',
          diagram: 'graph TD\n  A[Client] --> B[Serverless]\n  B --> C[Database]',
        },
      })

      const rows = ref([
        {
          id: '1',
          name: 'Features',
          'product-a': ['Full-featured', 'Extensible', 'Enterprise support'],
          'product-b': ['Core features', 'Easy to use', 'Community support'],
        },
        {
          id: '2',
          name: 'Pricing',
          'product-a': ['$500/month', 'Per-seat licensing'],
          'product-b': ['$50/month', 'Flat rate'],
        },
      ])

      return { config, rows, columnData }
    },
    template: `
      <EntityDetailTable
        :config="config"
        :rows="rows"
        :column-data="columnData"
      >
        <template #title>
          <v-card-title>Product Comparison with Special Rows</v-card-title>
        </template>
      </EntityDetailTable>
    `,
  }),
}
