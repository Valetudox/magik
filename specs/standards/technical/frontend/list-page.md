# List Page Standard

## Overview

**All list pages in the Magik frontend MUST use the `EntityListPage` component.**

This is a mandatory standard for displaying lists of entities (decisions, recordings, table documents, etc.). Custom list implementations are not permitted.

## Why This Standard Exists

- **Consistency**: All list pages have the same UX patterns
- **Type Safety**: Zod-based configuration prevents runtime errors
- **Maintainability**: One component to update, not dozens of pages
- **Feature Completeness**: Built-in search, sort, bulk operations, CRUD actions
- **Less Boilerplate**: Configure instead of coding

## Location

```
@packages/ui-shared/src/components/EntityListPage.vue
```

## Documentation & Examples

**For complete implementation details, patterns, and usage examples, see:**

```
@packages/ui-shared/src/components/EntityListPage.stories.ts
```

The Storybook stories provide:
- 7 different configuration patterns (Minimal, WithSearchAndSort, WithCustomFormatters, etc.)
- Complete code examples for each pattern
- JSDoc documentation explaining when to use each variant
- Type-safe configuration examples

**To view the interactive documentation:**

```bash
bun run storybook
```

Then navigate to: `Components > EntityListPage > Docs`

## Quick Start

1. Import the component and configuration type:
   ```typescript
   import { EntityListPage, type ListPageConfig } from '@packages/ui-shared'
   ```

2. Define your configuration:
   ```typescript
   const config: ListPageConfig<YourItemType> = {
     entityId: 'id',
     entityName: 'Item',
     entityNamePlural: 'Items',
     fields: [
       { key: 'name', title: 'Name', sortable: true },
       { key: 'status', title: 'Status', sortable: true },
     ],
     endpoints: {
       list: async () => api.getItems(),
     },
     enableSelection: false,
     enableSearch: true,
   }
   ```

3. Use the component:
   ```vue
   <template>
     <EntityListPage :config="config" />
   </template>
   ```

## Configuration Requirements

The configuration is type-safe and validated at runtime using Zod schemas. Key configuration options:

### Required Fields
- `entityId`: The unique identifier field (e.g., 'id')
- `entityName`: Singular name (e.g., 'Decision')
- `entityNamePlural`: Plural name (e.g., 'Decisions')
- `fields`: Array of field definitions
- `endpoints.list`: Function to fetch items
- `enableSelection`: Boolean to enable/disable row selection

### Optional Features
- `enableSearch`: Enable search functionality
- `rowActions`: Individual item actions (view, delete, custom)
- `bulkActions`: Multi-item operations (requires `enableSelection: true`)
- `createAction`: Add "Create" button with dialog or navigation
- `defaultSort`: Default sorting configuration
- `itemsPerPage`: Pagination size
- `pageUrls`: URL patterns for navigation

## Field Configuration

Each field supports:
- `key`: Property name from your data object
- `title`: Display header text
- `sortable`: Enable sorting for this column
- `align`: Column alignment ('start' | 'center' | 'end')
- `formatter`: Function to format the value as string
- `renderer`: Function to render Vue component (VNode)

## Examples from Codebase

### Current Implementations

1. **Recording List** (`apps/ui-audio/src/views/RecordingList.vue`)
   - Custom formatters for file size and duration
   - Row actions (view)
   - Search and sort

2. **Decision List** (`apps/ui-decision/src/views/DecisionList.vue`)
   - Bulk operations (push to Confluence)
   - Create dialog with custom form
   - Custom renderers for status chips
   - Row actions (view, delete)

## Strict Requirements

### ✅ MUST

1. **Use EntityListPage for all list pages** - No exceptions
2. **Define proper TypeScript types** - `ListPageConfig<YourType>`
3. **Provide all required configuration fields**
4. **Use formatters for text transformation**
5. **Use renderers for Vue components**
6. **Validate configuration** - It will be validated at runtime via Zod

### ❌ MUST NOT

1. **Create custom list implementations** - Always use EntityListPage
2. **Duplicate list page logic** - Reuse the component
3. **Bypass type safety** - Don't use `any` or type assertions
4. **Mix formatters and renderers** - Use the right one for your use case
5. **Skip the Storybook documentation** - Check stories for patterns before asking

## Pattern Selection Guide

Refer to the Storybook stories for detailed patterns. Quick guide:

- **Minimal**: Read-only lists with no interactions
- **WithSearchAndSort**: Large datasets requiring search/sort
- **WithCustomFormatters**: Rich data display (dates, file sizes, badges)
- **WithRowActions**: Individual item operations (view, delete, custom)
- **WithBulkOperations**: Multi-item operations (requires selection)
- **WithCreateAction**: Lists with create functionality
- **CompleteExample**: Full-featured implementation with all capabilities

## Validation

The configuration is validated at runtime using Zod schemas with discriminated unions. Invalid configurations will fail with clear error messages.

Common validation errors:
- Bulk actions without `enableSelection: true`
- Delete actions without `endpoints.delete`
- View actions without `pageUrls.edit`
- Create actions without `endpoints.create`

## Questions?

**Before asking:**
1. Check the Storybook stories (`EntityListPage.stories.ts`)
2. Review existing implementations (RecordingList.vue, DecisionList.vue)
3. Read the JSDoc comments in the component source

**If still unclear:**
- Ask with specific code examples
- Reference which pattern you're trying to implement
