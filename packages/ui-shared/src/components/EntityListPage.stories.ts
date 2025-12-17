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
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EntityListPage>

export default meta
type Story = StoryObj<typeof meta>

export const Minimal: Story = {
  args: {
    config: {
      entityId: 'id',
      entityName: 'Item',
      entityNamePlural: 'Items',
      fields: [
        { key: 'name', title: 'Name' },
        { key: 'status', title: 'Status' },
      ],
      endpoints: {
        list: async () => mockItems,
      },
      enableSelection: false,
    } satisfies ListPageConfig<MockItem>,
  },
}

export const WithSearchAndSort: Story = {
  args: {
    config: {
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
        list: async () => mockItems,
      },
      enableSelection: false,
      enableSearch: true,
      itemsPerPage: 10,
      defaultSort: [{ key: 'name', order: 'asc' }],
    } satisfies ListPageConfig<MockItem>,
  },
}

export const WithCustomFormatters: Story = {
  args: {
    config: {
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
        list: async () => mockItems,
      },
      enableSelection: false,
      enableSearch: true,
    } satisfies ListPageConfig<MockItem>,
  },
}

export const WithRowActions: Story = {
  args: {
    config: {
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

export const WithBulkOperations: Story = {
  args: {
    config: {
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

export const WithCreateAction: Story = {
  args: {
    config: {
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

export const CompleteExample: Story = {
  args: {
    config: {
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
