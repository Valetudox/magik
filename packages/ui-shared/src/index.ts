// Export page components
export { default as EntityListPage } from './pages/EntityListPage.vue'
export { default as EntityDetailPage } from './pages/EntityDetailPage.vue'

// Export all shared components
export { default as AppHeader, type HeaderMenuItem, type HeaderSubMenuItem } from './components/AppHeader.vue'
export { default as SimpleBox } from './components/SimpleBox.vue'
export { default as ListBox } from './components/ListBox.vue'
export { default as SectionedBox } from './components/SectionedBox.vue'
export { default as BoxSection } from './components/BoxSection.vue'
export { default as Editable } from './components/Editable.vue'
export { default as ClickMenu, type ClickMenuItem } from './components/ClickMenu.vue'
export { default as DeleteConfirmDialog } from './components/DeleteConfirmDialog.vue'
export { default as NameDescriptionDialog } from './components/NameDescriptionDialog.vue'
export { default as TextEditDialog } from './components/TextEditDialog.vue'
export { default as ListEditDialog } from './components/ListEditDialog.vue'
export { default as RatingDialog } from './components/RatingDialog.vue'
export { default as EntityDetailTable } from './components/EntityDetailTable.vue'
export { default as BulkOperationProgress } from './components/BulkOperationProgress.vue'
export { default as BulkOperationDialog } from './components/BulkOperationDialog.vue'
export { default as BulkActionsToolbar } from './components/list-page/BulkActionsToolbar.vue'

// Export composables
export { useListPage } from './composables/useListPage'

// Export utilities
export {
  formatDate,
  formatDateShort,
  formatRelativeTime,
  formatFileSize,
  formatDuration,
} from './utils/formatters'

export {
  validateListPageConfig,
  validateListPageConfigOrThrow,
  validateListPageConfigDev,
  type ValidationResult,
} from './utils/validateListPageConfig'

// Export Zod schemas and types
export {
  listPageConfigSchema,
  listFieldConfigSchema,
  rowActionConfigSchema,
  bulkActionConfigSchema,
  endpointConfigSchema,
  pageUrlConfigSchema,
  createActionConfigSchema,
  deleteDialogConfigSchema,
  socketConfigSchema,
  bulkOperationConfigSchema,
  bulkOperationResultSchema,
  type ListPageConfig,
  type ListFieldConfig,
  type RowActionConfig,
  type BulkActionConfig,
  type EndpointConfig,
  type PageUrlConfig,
  type CreateActionConfig,
  type DeleteDialogConfig,
  type SocketConfig,
  type BulkOperationConfig,
  type BulkOperationResult,
} from './types/list-page.schema'

// Export detail table schemas and types
export {
  detailTableConfigSchema,
  cellConfigSchema,
  ratingDecoratorSchema,
  ratingLevelSchema,
  textCellConfigSchema,
  listCellConfigSchema,
  mermaidCellConfigSchema,
  customCellConfigSchema,
  rowHeaderConfigSchema,
  menuItemSchema,
  headerBadgeSchema,
  specialRowSchema,
  type DetailTableConfig,
  type DetailTableConfigInput,
  type CellConfig,
  type CellConfigInput,
  type RatingDecorator,
  type RatingDecoratorInput,
  type RatingLevel,
  type TextCellConfig,
  type TextCellConfigInput,
  type ListCellConfig,
  type ListCellConfigInput,
  type MermaidCellConfig,
  type MermaidCellConfigInput,
  type CustomCellConfig,
  type CustomCellConfigInput,
  type RowHeaderConfig,
  type RowHeaderConfigInput,
  type MenuItem,
  type HeaderBadge,
  type SpecialRow,
  type CellUpdatePayload,
  type EditAiPayload,
  type RowHeaderMenuPayload,
  type ColumnHeaderMenuPayload,
  type SpecialRowUpdatePayload,
  type SpecialRowEditAiPayload,
} from './types/detail-table.schema'
