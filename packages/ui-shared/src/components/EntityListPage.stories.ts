import type { Meta, StoryObj } from '@storybook/vue3'
import { h } from 'vue'
import { VChip, VIcon } from 'vuetify/components'
import EntityListPage from './EntityListPage.vue'
import type { ListPageConfig } from '../types/list-page.schema'
import { formatDate, formatFileSize } from '../utils/formatters'

interface MockItem {
  id: string
  name: string
  status: 'active' | 'inactive' | 'pending'
  size: number
  createdAt: string
  category: string
}

const mockItems: MockItem[] = [
  {
    id: '1',
    name: 'First Item',
    status: 'active',
    size: 1024000,
    createdAt: '2024-01-15T10:30:00Z',
    category: 'Documentation',
  },
  {
    id: '2',
    name: 'Second Item',
    status: 'pending',
    size: 2048000,
    createdAt: '2024-02-20T14:20:00Z',
    category: 'Code',
  },
  {
    id: '3',
    name: 'Third Item',
    status: 'inactive',
    size: 512000,
    createdAt: '2024-03-10T09:15:00Z',
    category: 'Design',
  },
  {
    id: '4',
    name: 'Fourth Item',
    status: 'active',
    size: 4096000,
    createdAt: '2024-04-05T16:45:00Z',
    category: 'Documentation',
  },
  {
    id: '5',
    name: 'Fifth Item',
    status: 'active',
    size: 768000,
    createdAt: '2024-05-12T11:00:00Z',
    category: 'Code',
  },
]

const meta = {
  title: 'Components/EntityListPage',
  component: EntityListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# EntityListPage

A type-safe, configurable list page component with built-in search, sorting, filtering, bulk operations, and CRUD actions.

## Overview

EntityListPage provides a complete solution for displaying and managing lists of entities with minimal boilerplate. It uses Zod schemas for type-safe configuration and supports various patterns from simple read-only lists to complex data tables with bulk operations.

## Configuration

The component accepts a single \`config\` prop of type \`ListPageConfig<T>\` which provides type safety through discriminated unions:
- Use \`enableSelection: true\` to enable bulk operations
- Use \`createAction.enabled: true\` to add create functionality
- Customize fields with formatters, renderers, alignment, and sorting

See the variants below for specific use cases.
        `,
      },
    },
  },
} satisfies Meta<typeof EntityListPage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Minimal read-only list page. Use this for simple data views where users only need to see information without any interactions.
 *
 * **When to use:**
 * - Simple admin panels with read-only data
 * - Dashboard lists
 * - Reference data displays
 */
export const Minimal: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The simplest configuration with just data display. No search, sorting, or actions.',
      },
    },
  },
  args: {
    config: {
      pageTitle: 'Items',
      entityId: 'id',
      entityName: 'Item',
      entityNamePlural: 'Items',
      fields: [
        { key: 'name', title: 'Name' },
        { key: 'status', title: 'Status' },
      ],
      endpoints: {
        list: async () => [...mockItems],
      },
      enableSelection: false,
    } satisfies ListPageConfig<MockItem>,
  },
}

/**
 * List page with search and sortable columns. Use this when users need to find and organize data.
 *
 * **When to use:**
 * - Large datasets where users need to find specific items
 * - Tables where users need to sort by different criteria
 * - Data exploration interfaces
 */
export const WithSearchAndSort: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Adds search functionality and sortable columns. Set `sortable: true` on fields and `enableSearch: true` in config.',
      },
    },
  },
  args: {
    config: {
      pageTitle: 'Items',
      entityId: 'id',
      entityName: 'Item',
      entityNamePlural: 'Items',
      fields: [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'status', title: 'Status', sortable: true },
        { key: 'category', title: 'Category', sortable: true },
        { key: 'createdAt', title: 'Created', sortable: true },
      ],
      endpoints: {
        list: async () => [...mockItems],
      },
      enableSelection: false,
      enableSearch: true,
      itemsPerPage: 10,
      defaultSort: [{ key: 'name', order: 'asc' }],
    } satisfies ListPageConfig<MockItem>,
  },
}

/**
 * Custom formatters and renderers for rich data display. Use formatters for text transformation and renderers for Vue components.
 *
 * **When to use:**
 * - Display file sizes, dates, currency in human-readable formats
 * - Add visual indicators (chips, badges, icons)
 * - Custom cell rendering with Vue components
 */
export const WithCustomFormatters: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates `formatter` (returns string) and `renderer` (returns VNode) for custom cell display. Use formatters for simple text transformations and renderers for Vue components.',
      },
    },
  },
  args: {
    config: {
      pageTitle: 'Items',
      entityId: 'id',
      entityName: 'Item',
      entityNamePlural: 'Items',
      fields: [
        { key: 'name', title: 'Name', sortable: true },
        {
          key: 'status',
          title: 'Status',
          sortable: true,
          renderer: (value: string) =>
            h(
              VChip,
              {
                color: value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'error',
                size: 'small',
                variant: 'tonal',
              },
              () => value.toUpperCase()
            ),
        },
        {
          key: 'size',
          title: 'Size',
          sortable: true,
          align: 'end',
          formatter: (value: number) => formatFileSize(value),
        },
        {
          key: 'createdAt',
          title: 'Created',
          sortable: true,
          formatter: (value: string) => formatDate(value),
        },
      ],
      endpoints: {
        list: async () => [...mockItems],
      },
      enableSelection: false,
      enableSearch: true,
    } satisfies ListPageConfig<MockItem>,
  },
}

/**
 * Row actions for individual item operations. Supports view, delete, and custom actions.
 *
 * **When to use:**
 * - CRUD operations on individual items
 * - Item-specific actions (duplicate, download, export)
 * - Navigation to detail pages
 *
 * **Action types:**
 * - `view`: Navigation to edit/detail page (uses pageUrls.edit)
 * - `delete`: Delete operation (requires endpoints.delete)
 * - `custom`: Custom action with onClick handler
 */
export const WithRowActions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Adds action buttons to each row. Use `type: "view"` for navigation, `type: "delete"` for deletion, or `type: "custom"` with onClick handler for custom actions.',
      },
    },
  },
  args: {
    config: {
      pageTitle: 'Items',
      entityId: 'id',
      entityName: 'Item',
      entityNamePlural: 'Items',
      fields: [
        { key: 'name', title: 'Name', sortable: true },
        {
          key: 'status',
          title: 'Status',
          renderer: (value: string) =>
            h(
              VChip,
              {
                color: value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'error',
                size: 'small',
              },
              () => value
            ),
        },
      ],
      rowActions: [
        {
          type: 'view',
          icon: 'mdi-eye',
          title: 'View Details',
          color: 'primary',
        },
        {
          type: 'custom',
          icon: 'mdi-content-copy',
          title: 'Duplicate',
          onClick: async (item) => {
            alert(`Duplicating: ${item.name}`)
          },
        },
        {
          type: 'delete',
          icon: 'mdi-delete',
          title: 'Delete',
          color: 'error',
        },
      ],
      endpoints: {
        list: async () => mockItems,
        delete: async (id) => {
          console.log('Deleting item:', id)
          await new Promise((resolve) => setTimeout(resolve, 500))
        },
      },
      pageUrls: {
        edit: (item) => `/items/${item.id}`,
      },
      enableSelection: false,
      enableSearch: true,
    } satisfies ListPageConfig<MockItem>,
  },
}

/**
 * Bulk operations for multi-item actions. Requires `enableSelection: true`.
 *
 * **When to use:**
 * - Mass operations on multiple items (delete, archive, export)
 * - Batch processing workflows
 * - Data cleanup or migration tasks
 *
 * **Important:**
 * - Set `enableSelection: true` to enable checkboxes
 * - Use `type: "delete"` for bulk delete (uses endpoints.delete)
 * - Use `type: "custom"` with onClick handler for custom bulk actions
 */
export const WithBulkOperations: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Enables row selection and bulk actions toolbar. Set `enableSelection: true` and define `bulkActions` array. The onClick handler receives selectedIds and items arrays.',
      },
    },
  },
  args: {
    config: {
      pageTitle: 'Items',
      entityId: 'id',
      entityName: 'Item',
      entityNamePlural: 'Items',
      fields: [
        { key: 'name', title: 'Name', sortable: true },
        {
          key: 'status',
          title: 'Status',
          renderer: (value: string) =>
            h(
              VChip,
              {
                color: value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'error',
                size: 'small',
              },
              () => value
            ),
        },
        { key: 'category', title: 'Category', sortable: true },
      ],
      rowActions: [
        {
          type: 'view',
          icon: 'mdi-eye',
          title: 'View',
        },
        {
          type: 'delete',
          icon: 'mdi-delete',
          title: 'Delete',
          color: 'error',
        },
      ],
      bulkActions: [
        {
          type: 'delete',
          label: 'Delete Selected',
          icon: 'mdi-delete',
          color: 'error',
        },
        {
          type: 'custom',
          label: 'Archive Selected',
          icon: 'mdi-archive',
          onClick: async (selectedIds, items) => {
            alert(`Archiving ${items.length} items: ${items.map((i) => i.name).join(', ')}`)
          },
        },
      ],
      endpoints: {
        list: async () => mockItems,
        delete: async (id) => {
          console.log('Deleting item:', id)
          await new Promise((resolve) => setTimeout(resolve, 500))
        },
      },
      pageUrls: {
        edit: (item) => `/items/${item.id}`,
      },
      enableSelection: true,
      enableSearch: true,
      itemsPerPage: 25,
    } satisfies ListPageConfig<MockItem>,
  },
}

/**
 * Create action for adding new items. Supports dialog or navigation modes.
 *
 * **When to use:**
 * - Lists where users can create new items
 * - Admin interfaces with data management
 * - Form-based data entry
 *
 * **Configuration:**
 * - Set `createAction.enabled: true` and `createAction.useDialog: true` for dialog mode
 * - Set `createAction.enabled: true` and `createAction.useDialog: false` with `pageUrls.create` for navigation mode
 * - Provide `endpoints.create` for API calls
 * - Use `onCreate` callback for custom logic after creation
 */
export const WithCreateAction: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Adds a "Create" button in the header. Use `useDialog: true` with a custom `create-dialog` slot, or `useDialog: false` with `pageUrls.create` for navigation to a create page.',
      },
    },
  },
  args: {
    config: {
      pageTitle: 'Items',
      entityId: 'id',
      entityName: 'Item',
      entityNamePlural: 'Items',
      fields: [
        { key: 'name', title: 'Name', sortable: true },
        {
          key: 'status',
          title: 'Status',
          renderer: (value: string) =>
            h(
              VChip,
              {
                color: value === 'active' ? 'success' : 'warning',
                size: 'small',
              },
              () => value
            ),
        },
      ],
      rowActions: [
        {
          type: 'view',
          icon: 'mdi-pencil',
          title: 'Edit',
        },
      ],
      createAction: {
        enabled: true,
        label: 'New Item',
        useDialog: true,
        dialogTitle: 'Create New Item',
        onCreate: async (item) => {
          console.log('Item created:', item)
        },
      },
      endpoints: {
        list: async () => mockItems,
        create: async (data) => {
          console.log('Creating item:', data)
          await new Promise((resolve) => setTimeout(resolve, 500))
          return { id: Math.random().toString(), ...data }
        },
      },
      pageUrls: {
        edit: (item) => `/items/${item.id}`,
      },
      enableSelection: false,
      enableSearch: true,
    } satisfies ListPageConfig<MockItem>,
  },
}

/**
 * Complete example combining all features. Demonstrates the full power of EntityListPage.
 *
 * **When to use:**
 * - Full-featured admin panels
 * - Complex data management interfaces
 * - Production-ready list pages with all capabilities
 *
 * **Features included:**
 * - Custom formatters and renderers for rich display
 * - Row actions (view, duplicate, download, delete)
 * - Bulk operations (delete, archive, export)
 * - Create action with dialog
 * - Search and sorting
 * - Custom delete confirmation messages
 * - Conditional action disabling
 */
export const CompleteExample: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A full-featured example combining all capabilities: custom formatters, row actions, bulk operations, create dialog, search, sorting, and custom delete confirmations. Use this as a reference for complex implementations.',
      },
    },
  },
  args: {
    config: {
      pageTitle: 'Items',
      entityId: 'id',
      entityName: 'Item',
      entityNamePlural: 'Items',
      fields: [
        { key: 'name', title: 'Name', sortable: true, align: 'start' },
        {
          key: 'status',
          title: 'Status',
          sortable: true,
          align: 'center',
          renderer: (value: string) =>
            h(
              VChip,
              {
                color: value === 'active' ? 'success' : value === 'pending' ? 'warning' : 'error',
                size: 'small',
                variant: 'tonal',
              },
              () => [
                h(VIcon, { start: true, size: 'small' }, () =>
                  value === 'active'
                    ? 'mdi-check-circle'
                    : value === 'pending'
                      ? 'mdi-clock'
                      : 'mdi-close-circle'
                ),
                value.toUpperCase(),
              ]
            ),
        },
        {
          key: 'category',
          title: 'Category',
          sortable: true,
          formatter: (value: string) => value || '(none)',
        },
        {
          key: 'size',
          title: 'Size',
          sortable: true,
          align: 'end',
          formatter: (value: number) => formatFileSize(value),
        },
        {
          key: 'createdAt',
          title: 'Created',
          sortable: true,
          formatter: (value: string) => formatDate(value),
        },
      ],
      rowActions: [
        {
          type: 'view',
          icon: 'mdi-pencil',
          title: 'Edit',
          color: 'primary',
        },
        {
          type: 'custom',
          icon: 'mdi-content-copy',
          title: 'Duplicate',
          onClick: async (item) => {
            alert(`Duplicating: ${item.name}`)
          },
        },
        {
          type: 'custom',
          icon: 'mdi-download',
          title: 'Download',
          onClick: async (item) => {
            alert(`Downloading: ${item.name}`)
          },
          disabled: (item) => item.status === 'pending',
        },
        {
          type: 'delete',
          icon: 'mdi-delete',
          title: 'Delete',
          color: 'error',
        },
      ],
      bulkActions: [
        {
          type: 'delete',
          label: 'Delete Selected',
          icon: 'mdi-delete',
          color: 'error',
        },
        {
          type: 'custom',
          label: 'Archive Selected',
          icon: 'mdi-archive',
          onClick: async (selectedIds, items) => {
            alert(`Archiving ${items.length} items`)
          },
        },
        {
          type: 'custom',
          label: 'Export Selected',
          icon: 'mdi-export',
          onClick: async (selectedIds, items) => {
            alert(`Exporting ${items.length} items`)
          },
        },
      ],
      createAction: {
        enabled: true,
        label: 'Create Item',
        useDialog: true,
        dialogTitle: 'Create New Item',
        onCreate: async (item) => {
          console.log('Created:', item)
        },
      },
      endpoints: {
        list: async () => mockItems,
        create: async (data) => {
          console.log('Creating:', data)
          await new Promise((resolve) => setTimeout(resolve, 500))
          return { id: Math.random().toString(), ...data }
        },
        delete: async (id) => {
          console.log('Deleting:', id)
          await new Promise((resolve) => setTimeout(resolve, 500))
        },
      },
      pageUrls: {
        edit: (item) => `/items/${item.id}`,
      },
      deleteDialog: {
        confirmMessage: (item) => `Are you sure you want to delete "${item.name}"?`,
        bulkConfirmMessage: (count) => `Are you sure you want to delete ${count} items?`,
      },
      enableSelection: true,
      enableSearch: true,
      itemsPerPage: 10,
      defaultSort: [{ key: 'name', order: 'asc' }],
    } satisfies ListPageConfig<MockItem>,
  },
}
