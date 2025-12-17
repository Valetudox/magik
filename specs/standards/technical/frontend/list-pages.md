# Frontend List Pages Standard

## Overview

All list pages in frontend applications MUST use the `EntityListPage` component from `@magik/ui-shared`. This component provides a configuration-based approach for building consistent, feature-rich list views.

## Core Component

```typescript
import { EntityListPage, type ListPageConfig } from '@magik/ui-shared'
```

The component accepts a single `config` prop of type `ListPageConfig<T>` where `T` is your entity type.

## Configuration Structure

### Required Properties

```typescript
const config: ListPageConfig<YourEntity> = {
  // Entity identification
  entityId: 'id',              // Property name used as unique identifier
  entityName: 'Item',          // Singular display name
  entityNamePlural: 'Items',   // Plural display name

  // Field definitions
  fields: [/* ListFieldConfig[] */],

  // API endpoints
  endpoints: {
    list: () => Promise<YourEntity[]>
  },
}
```

### Field Configuration

Each field in the `fields` array supports:

```typescript
{
  key: string              // Property key from entity
  title: string            // Column header text
  sortable?: boolean       // Enable sorting (default: false)
  align?: 'start' | 'center' | 'end'
  width?: string | number  // Column width

  // Value transformation (choose one)
  formatter?: (value: any, item: T) => string | number | boolean
  renderer?: (value: any, item: T) => VNode | Component
}
```

**Field rendering priority:**
1. `renderer` - Custom VNode/Component (for chips, icons, etc.)
2. `formatter` - Transform to string/number/boolean
3. Raw value - Direct display

### Optional Properties

```typescript
{
  // Actions
  rowActions?: RowActionConfig<T>[]      // Actions per row
  bulkActions?: BulkActionConfig<T>[]    // Actions for selected items
  createAction?: CreateActionConfig       // Create new item action

  // Additional endpoints
  endpoints: {
    list: () => Promise<T[]>
    create?: (data: any) => Promise<{ id: string }>
    delete?: (id: string) => Promise<void>
  },

  // Navigation
  pageUrls?: {
    edit?: (item: T) => string  // Detail page URL generator
    create?: string             // Create page URL (if not using dialog)
  },

  // Real-time updates
  socket?: SocketConfig<T>,

  // UI behavior
  enableSelection?: boolean    // Enable row selection (default: false)
  enableSearch?: boolean       // Enable search field (default: false)
  itemsPerPage?: number        // Rows per page (default: 50)
  defaultSort?: [{ key: string; order: 'asc' | 'desc' }]

  // Dialog customization
  deleteDialog?: {
    confirmMessage?: (item: T) => string
    bulkConfirmMessage?: (count: number) => string
  }
}
```

## Use Cases

### Use Case 1: Read-Only List (No Operations)

**Scenario:** Display data without create, edit, or delete capabilities.

**Example:** Audio recordings list from file system.

```typescript
const config: ListPageConfig<Recording> = {
  entityId: 'id',
  entityName: 'Recording',
  entityNamePlural: 'Audio Recordings',

  fields: [
    { key: 'filename', title: 'Filename', sortable: true },
    { key: 'size', title: 'Size', formatter: formatFileSize },
  ],

  rowActions: [
    { type: 'view', icon: 'mdi-eye', title: 'View Details' }
  ],

  endpoints: {
    list: () => api.getRecordings()
  },

  pageUrls: {
    edit: (item) => `/${item.id}`
  },

  // No operations
  bulkActions: undefined,
  createAction: undefined,
  enableSelection: false,
  enableSearch: true,
}
```

**Key features:**
- View-only row action
- No bulk operations
- No selection
- No create/delete endpoints
- Search enabled for filtering

### Use Case 2: Full CRUD with Bulk Operations

**Scenario:** Complete create, read, update, delete with bulk actions.

**Example:** Decision documents with Confluence integration.

```typescript
const config: ListPageConfig<Decision> = {
  entityId: 'id',
  entityName: 'Decision',
  entityNamePlural: 'Decision Documents',

  fields: [
    {
      key: 'status',
      title: 'Status',
      renderer: (value) => h(VChip, { color: getStatusColor(value) }, value)
    },
    { key: 'name', title: 'Name', sortable: true },
    { key: 'createdAt', title: 'Created', formatter: formatDate },
  ],

  rowActions: [
    { type: 'view', icon: 'mdi-pencil', title: 'Edit' },
    {
      type: 'custom',
      icon: 'mdi-open-in-new',
      title: 'Open in Confluence',
      onClick: (item) => window.open(item.confluenceLink, '_blank'),
      disabled: (item) => !item.confluenceLink
    },
    { type: 'delete', icon: 'mdi-delete', title: 'Delete', color: 'error' },
  ],

  bulkActions: [
    { type: 'delete', label: 'Delete', icon: 'mdi-delete', color: 'error' },
    {
      type: 'custom',
      label: 'Push to Confluence',
      icon: 'mdi-upload',
      onClick: handleBulkPush,
      disabled: (ids, items) => items.some(i => !i.confluenceLink)
    },
  ],

  createAction: {
    enabled: true,
    label: 'New Decision',
    useDialog: true,
  },

  endpoints: {
    list: () => api.getDecisions(),
    delete: (id) => api.deleteDecision(id),
  },

  pageUrls: {
    edit: (item) => `/${item.id}`
  },

  enableSelection: true,
  enableSearch: true,
}
```

**Key features:**
- Multiple row actions (view, custom, delete)
- Bulk delete and custom bulk actions
- Create action with dialog
- Row selection enabled
- Conditional action disabling

### Use Case 3: With Real-Time Updates (Socket.IO)

**Scenario:** List that updates in real-time via WebSocket.

```typescript
const config: ListPageConfig<Decision> = {
  // ... other config ...

  socket: {
    enabled: true,
    initSocket: () => initSocket(),
    handlers: {
      onUpdated: (callback) => {
        return onItemUpdated(({ id, data }) => {
          callback({ id, ...data, updatedAt: new Date().toISOString() })
        })
      },
      onAdded: (callback) => {
        return onItemAdded(({ id, data }) => {
          callback({ id, ...data })
        })
      },
      onDeleted: (callback) => {
        return onItemDeleted(({ id }) => {
          callback({ id })
        })
      },
    },
  },
}
```

**Key features:**
- Automatic list updates on server events
- Cleanup handlers returned from event subscriptions
- Transform server data to match entity shape

### Use Case 4: Custom Field Rendering

**Scenario:** Display complex data with chips, icons, and formatted values.

```typescript
import { h } from 'vue'
import { VChip, VIcon } from 'vuetify/components'
import { formatDate, formatFileSize, formatDuration } from '@magik/ui-shared'

const config: ListPageConfig<Item> = {
  // ... other config ...

  fields: [
    // Chip rendering
    {
      key: 'format',
      title: 'Format',
      renderer: (value) => h(VChip, {
        color: value === 'mp3' ? 'primary' : 'secondary',
        size: 'small'
      }, () => value.toUpperCase())
    },

    // Icon rendering
    {
      key: 'hasTranscript',
      title: 'Transcript',
      renderer: (value) => h(VIcon, {
        icon: value ? 'mdi-check-circle' : 'mdi-close-circle',
        color: value ? 'success' : 'error'
      })
    },

    // Formatter functions
    {
      key: 'size',
      title: 'Size',
      formatter: (value) => formatFileSize(value)
    },

    // Access nested properties
    {
      key: 'metadata',
      title: 'Duration',
      formatter: (_value, item) => formatDuration(item.metadata?.duration)
    },
  ],
}
```

**Available formatters:**
- `formatDate(value)` - ISO date to localized format
- `formatFileSize(bytes)` - Bytes to human-readable size
- `formatDuration(seconds)` - Seconds to MM:SS format

### Use Case 5: Custom Create Dialog

**Scenario:** Use a custom component for item creation instead of default dialog.

```vue
<template>
  <EntityListPage :config="config">
    <template #create-dialog="{ show, onClose }">
      <CreateItemDialog
        :model-value="show"
        @update:model-value="(value) => !value && onClose()"
        @created="handleItemCreated"
      />
    </template>
  </EntityListPage>
</template>

<script setup lang="ts">
const config: ListPageConfig<Item> = {
  // ... other config ...

  createAction: {
    enabled: true,
    label: 'New Item',
    useDialog: true,
  },
}

const handleItemCreated = (result: { id: string }) => {
  // Navigate to detail page or reload list
  router.push(`/${result.id}`)
}
</script>
```

## Action Types

### Row Actions

```typescript
// Built-in view action (navigates to pageUrls.edit)
{ type: 'view', icon: 'mdi-pencil', title: 'Edit' }

// Built-in delete action (shows confirmation dialog)
{ type: 'delete', icon: 'mdi-delete', title: 'Delete', color: 'error' }

// Custom action with callback
{
  type: 'custom',
  icon: 'mdi-download',
  title: 'Download',
  onClick: async (item) => { /* custom logic */ },
  disabled: (item) => !item.downloadUrl,
  color: 'primary'
}
```

### Bulk Actions

```typescript
// Built-in bulk delete (shows confirmation dialog)
{ type: 'delete', label: 'Delete', icon: 'mdi-delete', color: 'error' }

// Custom bulk action
{
  type: 'custom',
  label: 'Export Selected',
  icon: 'mdi-export',
  onClick: async (selectedIds, items) => { /* custom logic */ },
  disabled: (selectedIds, items) => items.length > 100
}
```

## File Location Pattern

List page views MUST be located in:
```
apps/ui-{domain}/src/views/{Entity}List.vue
```

Examples:
- `apps/ui-audio/src/views/RecordingList.vue`
- `apps/ui-decision/src/views/DecisionList.vue`
- `apps/ui-specification/src/views/SpecificationList.vue`

## Quick Decision Matrix

| Feature | No Operations | Read + View | Full CRUD | With Bulk | With Socket |
|---------|---------------|-------------|-----------|-----------|-------------|
| `enableSelection` | `false` | `false` | `true` | `true` | any |
| `enableSearch` | `true` | `true` | `true` | `true` | any |
| `rowActions` | none | view only | view, delete | view, delete | any |
| `bulkActions` | `undefined` | `undefined` | delete | delete, custom | any |
| `createAction` | `undefined` | `undefined` | enabled | enabled | any |
| `endpoints.delete` | `undefined` | `undefined` | defined | defined | any |
| `socket` | `undefined` | `undefined` | optional | optional | required |

## Best Practices

1. **Always use `formatter` for simple value transformation** (dates, numbers, booleans)
2. **Use `renderer` for Vue components** (chips, icons, complex markup)
3. **Enable selection only when bulk actions exist**
4. **Provide meaningful entity names** (shown in dialogs and toolbar)
5. **Use conditional `disabled` functions** for context-aware actions
6. **Leverage type safety** with generic `ListPageConfig<YourEntity>`
7. **Keep formatters pure** - no side effects
8. **Return cleanup functions** from Socket.IO event handlers

## Anti-Patterns

❌ **Don't** enable selection without bulk actions
❌ **Don't** define unused endpoints (leave as `undefined`)
❌ **Don't** mix formatter and renderer on same field
❌ **Don't** forget to handle async errors in custom actions
❌ **Don't** mutate items in formatters or renderers
❌ **Don't** create custom list components - extend EntityListPage instead
