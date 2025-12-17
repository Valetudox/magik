# Frontend List Pages Standard

## Overview

All list pages MUST use `EntityListPage` from `@magik/ui-shared` with configuration validated by Zod schemas.

## Core Component

```typescript
import { EntityListPage, type ListPageConfig } from '@magik/ui-shared'
```

## Validation

### Why Validation?

Zod schemas with discriminated unions prevent invalid states:

1. `bulkActions` requires `enableSelection: true`
2. `socket.enabled: true` requires `handlers`
3. Delete actions require `endpoints.delete`
4. Fields cannot have both `formatter` and `renderer`
5. `createAction.useDialog: false` requires `pageUrls.create`

See full schemas: [`list-page.schema.ts`](../../../../packages/ui-shared/src/types/list-page.schema.ts)

### Validation Usage

```typescript
import { validateListPageConfig, validateListPageConfigOrThrow } from '@magik/ui-shared'

// Safe validation
const result = validateListPageConfig(config)
if (!result.success) {
  console.error(result.errors)
}

// Fail fast
validateListPageConfigOrThrow(config)

// Dev-only (recommended)
validateListPageConfigDev(config)
```

## Configuration Structure

### Minimal Config

```typescript
const config: ListPageConfig<T> = {
  entityId: 'id',
  entityName: 'Item',
  entityNamePlural: 'Items',
  fields: [
    { key: 'name', title: 'Name', sortable: true }
  ],
  endpoints: {
    list: () => api.getItems()
  },
}
```

### With Operations

```typescript
const config: ListPageConfig<T> = {
  // ...base config

  enableSelection: true,  // Required for bulk actions
  bulkActions: [
    { type: 'delete', label: 'Delete', icon: 'mdi-delete' }
  ],

  rowActions: [
    { type: 'view', icon: 'mdi-pencil', title: 'Edit' },
    { type: 'delete', icon: 'mdi-delete', title: 'Delete' }
  ],

  createAction: {
    enabled: true,
    useDialog: true,  // or false with pageUrls.create
  },

  endpoints: {
    list: () => api.getItems(),
    delete: (id) => api.deleteItem(id),  // Required for delete actions
  },
}
```

## Use Cases

### Read-Only List

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
    { type: 'view', icon: 'mdi-eye', title: 'View' }
  ],

  endpoints: {
    list: () => api.getRecordings()
  },

  pageUrls: {
    edit: (item) => `/${item.id}`
  },

  enableSelection: false,  // No bulk operations
  enableSearch: true,
}
```

### Full CRUD with Bulk Operations

```typescript
const config: ListPageConfig<Decision> = {
  entityId: 'id',
  entityName: 'Decision',
  entityNamePlural: 'Decision Documents',

  fields: [
    {
      key: 'status',
      title: 'Status',
      renderer: (value) => h(VChip, { color: getColor(value) }, value)
    },
    { key: 'name', title: 'Name', sortable: true },
    { key: 'createdAt', title: 'Created', formatter: formatDate },
  ],

  rowActions: [
    { type: 'view', icon: 'mdi-pencil', title: 'Edit' },
    {
      type: 'custom',
      icon: 'mdi-open-in-new',
      title: 'Open',
      onClick: (item) => window.open(item.url, '_blank'),
      disabled: (item) => !item.url
    },
    { type: 'delete', icon: 'mdi-delete', title: 'Delete', color: 'error' },
  ],

  bulkActions: [
    { type: 'delete', label: 'Delete', icon: 'mdi-delete', color: 'error' },
    {
      type: 'custom',
      label: 'Export',
      icon: 'mdi-export',
      onClick: (ids, items) => exportItems(items),
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

### With Socket.IO Real-Time Updates

Schema: [`socketConfigSchema`](../../../../packages/ui-shared/src/types/list-page.schema.ts)

```typescript
const config: ListPageConfig<T> = {
  // ...base config

  socket: {
    enabled: true,
    initSocket: () => initSocket(),
    handlers: {
      onUpdated: (callback) => {
        return onItemUpdated(({ id, data }) => {
          callback({ id, ...data })
        })
      },
      onAdded: (callback) => {
        return onItemAdded(({ id, data }) => callback({ id, ...data }))
      },
      onDeleted: (callback) => {
        return onItemDeleted(({ id }) => callback({ id }))
      },
    },
  },
}
```

### Custom Field Rendering

Schema: [`listFieldConfigSchema`](../../../../packages/ui-shared/src/types/list-page.schema.ts)

```typescript
import { h } from 'vue'
import { VChip, VIcon } from 'vuetify/components'
import { formatDate, formatFileSize, formatDuration } from '@magik/ui-shared'

fields: [
  // Formatter (simple transform)
  { key: 'size', title: 'Size', formatter: (v) => formatFileSize(v) },
  { key: 'date', title: 'Date', formatter: formatDate },

  // Renderer (Vue component)
  {
    key: 'status',
    title: 'Status',
    renderer: (value) => h(VChip, { color: 'primary' }, value)
  },
  {
    key: 'active',
    title: 'Active',
    renderer: (value) => h(VIcon, {
      icon: value ? 'mdi-check' : 'mdi-close',
      color: value ? 'success' : 'error'
    })
  },

  // Access nested props
  {
    key: 'metadata',
    title: 'Duration',
    formatter: (_value, item) => formatDuration(item.metadata?.duration)
  },
]
```

### Custom Create Dialog

```vue
<template>
  <EntityListPage :config="config">
    <template #create-dialog="{ show, onClose }">
      <MyCustomDialog
        :model-value="show"
        @update:model-value="(v) => !v && onClose()"
        @created="handleCreated"
      />
    </template>
  </EntityListPage>
</template>

<script setup lang="ts">
const config: ListPageConfig<T> = {
  // ...base config
  createAction: {
    enabled: true,
    useDialog: true,
  },
}

const handleCreated = (result: { id: string }) => {
  router.push(`/${result.id}`)
}
</script>
```

## Discriminated Union Schemas

See [`list-page.schema.ts`](../../../../packages/ui-shared/src/types/list-page.schema.ts) for full definitions.

### Socket Configuration

Discriminates on `enabled`:

```typescript
// enabled: false - handlers not required
socket: { enabled: false }

// enabled: true - handlers required
socket: {
  enabled: true,
  handlers: { onUpdated, onAdded, onDeleted }
}
```

### Create Action

Discriminates on `enabled`:

```typescript
// Disabled
createAction: { enabled: false }

// With dialog (default)
createAction: {
  enabled: true,
  useDialog: true,
  dialogComponent: MyDialog
}

// With URL navigation
createAction: {
  enabled: true,
  useDialog: false,
  // pageUrls.create required in main config
}
```

### Selection & Bulk Actions

Discriminates on `enableSelection`:

```typescript
// Without selection - bulkActions not allowed
{
  enableSelection: false,
  bulkActions: undefined
}

// With selection - bulkActions allowed
{
  enableSelection: true,
  bulkActions: [...]
}
```

## Action Types

Schema: [`rowActionConfigSchema`](../../../../packages/ui-shared/src/types/list-page.schema.ts), [`bulkActionConfigSchema`](../../../../packages/ui-shared/src/types/list-page.schema.ts)

### Row Actions

```typescript
// View (navigates to pageUrls.edit)
{ type: 'view', icon: 'mdi-pencil', title: 'Edit' }

// Delete (shows confirmation)
{ type: 'delete', icon: 'mdi-delete', title: 'Delete', color: 'error' }

// Custom (requires onClick)
{
  type: 'custom',
  icon: 'mdi-download',
  title: 'Download',
  onClick: (item) => download(item),
  disabled: (item) => !item.downloadUrl
}
```

### Bulk Actions

```typescript
// Delete (shows confirmation)
{ type: 'delete', label: 'Delete', icon: 'mdi-delete', color: 'error' }

// Custom (requires onClick)
{
  type: 'custom',
  label: 'Export',
  icon: 'mdi-export',
  onClick: (ids, items) => exportItems(items),
  disabled: (ids, items) => items.length > 100
}
```

## File Location

```
apps/ui-{domain}/src/views/{Entity}List.vue
```

Examples:
- `apps/ui-audio/src/views/RecordingList.vue`
- `apps/ui-decision/src/views/DecisionList.vue`

## Quick Reference

| Feature | No Ops | Read+View | Full CRUD | With Bulk |
|---------|--------|-----------|-----------|-----------|
| `enableSelection` | `false` | `false` | `false` | `true` |
| `bulkActions` | `undefined` | `undefined` | `undefined` | defined |
| `rowActions` | none | view | view, delete | view, delete |
| `createAction` | `undefined` | `undefined` | enabled | enabled |
| `endpoints.delete` | `undefined` | `undefined` | defined | defined |

## Best Practices

1. Use `formatter` for simple transforms (dates, numbers)
2. Use `renderer` for Vue components (chips, icons)
3. Enable selection only with bulk actions
4. Validate in development with `validateListPageConfigDev()`
5. Use discriminated unions for type safety
6. Keep formatters pure (no side effects)
7. Return cleanup functions from socket handlers

## Invalid States (Prevented)

These will fail validation:

```typescript
// ❌ Bulk actions without selection
{ enableSelection: false, bulkActions: [...] }

// ❌ Delete without endpoint
{ rowActions: [{ type: 'delete', ... }], endpoints: { delete: undefined } }

// ❌ Socket enabled without handlers
{ socket: { enabled: true } }

// ❌ Both formatter and renderer
{ fields: [{ formatter: ..., renderer: ... }] }

// ❌ useDialog=false without URL
{ createAction: { useDialog: false }, pageUrls: { create: undefined } }
```

## Development Validation

```vue
<script setup lang="ts">
import { EntityListPage, validateListPageConfigDev } from '@magik/ui-shared'

const config: ListPageConfig<T> = { /* ... */ }

validateListPageConfigDev(config)  // Warns in dev mode only
</script>

<template>
  <EntityListPage :config="config" />
</template>
```
