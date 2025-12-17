# Frontend Technical Standards

This directory contains the standardized patterns and conventions for frontend applications in the Magik monorepo.

## Standards Organization

### Component Standards
- [List Page](./list-page.md) - **Mandatory** EntityListPage component for all list views

## Quick Start

All frontend list pages MUST:
- Use `EntityListPage` component from `@packages/ui-shared`
- Define type-safe `ListPageConfig<T>` configuration
- Follow patterns documented in `EntityListPage.stories.ts`
- Check Storybook documentation before implementation

## Shared UI Components

Location: `packages/ui-shared/src/`

### Available Components
- **EntityListPage**: Configurable list page with search, sort, filtering, bulk operations, and CRUD actions
- **DeleteConfirmDialog**: Standard delete confirmation dialog
- **BulkOperationDialog**: Progress tracking for bulk operations
- **BulkActionsToolbar**: Toolbar for bulk action buttons

### Composables
- **useListPage**: Core list page logic (data fetching, sorting, filtering, selection)

### Utilities
- **formatters**: Standard formatters for dates, file sizes, durations
- **validateListPageConfig**: Runtime validation using Zod schemas

## Development Workflow

1. **Check Storybook first**: Run `bun run storybook` to see available patterns
2. **Choose the right pattern**: Select from the 7 story variants
3. **Implement with TypeScript**: Use `ListPageConfig<YourType>` for type safety
4. **Test your configuration**: Zod validation will catch errors at runtime

## Documentation

**Primary documentation is in Storybook stories** - they serve as both documentation and examples.

To view:
```bash
bun run storybook
```

Navigate to: `Components > EntityListPage > Docs`
