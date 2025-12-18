import { z } from 'zod'

// Menu item schema (for header menus)
export const menuItemSchema = z.object({
  key: z.string(),
  title: z.string(),
  icon: z.string().optional(),
  class: z.string().optional(),
})

export type MenuItem = z.infer<typeof menuItemSchema>

// Header badge schema
export const headerBadgeSchema = z.object({
  label: z.string(),
  color: z.string(),
  icon: z.string().optional(),
})

export type HeaderBadge = z.infer<typeof headerBadgeSchema>

// Rating level configuration
export const ratingLevelSchema = z.object({
  key: z.string(),
  label: z.string(),
  color: z.string(), // CSS color or Vuetify theme color (success, warning, error)
  icon: z.string().optional(),
})

export type RatingLevel = z.infer<typeof ratingLevelSchema>

// Rating decorator - adds rating bar to any cell type
export const ratingDecoratorSchema = z.object({
  key: z.string(), // Field containing rating value
  levels: z.array(ratingLevelSchema).min(2),
  allowEmpty: z.boolean().optional().default(true),
  emptyLabel: z.string().optional().default('Not rated'),
})

export type RatingDecorator = z.infer<typeof ratingDecoratorSchema>
export type RatingDecoratorInput = z.input<typeof ratingDecoratorSchema>

// Base cell configuration shared by all cell types
const baseCellConfig = z.object({
  key: z.string(),
  header: z.string(),
  width: z.string().optional(),
  editable: z.boolean().optional().default(true),
  rating: ratingDecoratorSchema.optional(), // Optional rating bar on left
  headerMenu: z.array(menuItemSchema).optional(), // Context menu for column header
  headerBadges: z.array(headerBadgeSchema).optional(), // Badges shown next to header
})

// Text cell - simple text with TextEditDialog
export const textCellConfigSchema = baseCellConfig.extend({
  type: z.literal('text'),
  multiline: z.boolean().optional().default(false),
})

export type TextCellConfig = z.infer<typeof textCellConfigSchema>
export type TextCellConfigInput = z.input<typeof textCellConfigSchema>

// List cell - array of strings with ListEditDialog
export const listCellConfigSchema = baseCellConfig.extend({
  type: z.literal('list'),
  itemLabel: z.string().optional().default('Item'),
})

export type ListCellConfig = z.infer<typeof listCellConfigSchema>
export type ListCellConfigInput = z.input<typeof listCellConfigSchema>

// Mermaid cell - mermaid diagram with editor
export const mermaidCellConfigSchema = baseCellConfig.extend({
  type: z.literal('mermaid'),
})

export type MermaidCellConfig = z.infer<typeof mermaidCellConfigSchema>
export type MermaidCellConfigInput = z.input<typeof mermaidCellConfigSchema>

// Custom cell - uses slot for rendering
export const customCellConfigSchema = baseCellConfig.extend({
  type: z.literal('custom'),
  slotName: z.string(),
})

export type CustomCellConfig = z.infer<typeof customCellConfigSchema>
export type CustomCellConfigInput = z.input<typeof customCellConfigSchema>

// Union of all cell types (discriminated by 'type')
export const cellConfigSchema = z.discriminatedUnion('type', [
  textCellConfigSchema,
  listCellConfigSchema,
  mermaidCellConfigSchema,
  customCellConfigSchema,
])

export type CellConfig = z.infer<typeof cellConfigSchema>
export type CellConfigInput = z.input<typeof cellConfigSchema>

// Row header configuration (optional first column)
export const rowHeaderConfigSchema = z.object({
  key: z.string(),
  header: z.string(),
  width: z.string().optional(),
  tooltip: z.string().optional(), // Field key to get tooltip text from row data
  menu: z.array(menuItemSchema).optional(), // Context menu for row headers
})

export type RowHeaderConfig = z.infer<typeof rowHeaderConfigSchema>
export type RowHeaderConfigInput = z.input<typeof rowHeaderConfigSchema>

// Special row configuration (rows before data rows, e.g., Description, Architecture)
export const specialRowSchema = z.object({
  key: z.string(), // Row identifier
  header: z.string(), // Row header label
  type: z.enum(['text', 'mermaid', 'custom']),
  fieldKey: z.string(), // Field in columnData to display
  slotName: z.string().optional(), // For type: 'custom'
})

export type SpecialRow = z.infer<typeof specialRowSchema>

// Main table configuration schema
export const detailTableConfigSchema = z.object({
  rowKey: z.string(),
  columns: z.array(cellConfigSchema),
  rowHeader: rowHeaderConfigSchema.optional(),
  specialRows: z.array(specialRowSchema).optional(), // Rows before data rows
  editable: z.boolean().optional().default(true),
  emptyText: z.string().optional().default('No data'),
})

export type DetailTableConfig = z.infer<typeof detailTableConfigSchema>
export type DetailTableConfigInput = z.input<typeof detailTableConfigSchema>

// Cell update payload emitted by EntityDetailTable
export interface CellUpdatePayload {
  rowKey: string
  columnKey: string
  value: unknown
}

// Edit with AI payload
export interface EditAiPayload {
  rowKey: string
  columnKey: string
}

// Row header menu selection payload
export interface RowHeaderMenuPayload {
  rowKey: string
  menuKey: string
  row: Record<string, unknown>
}

// Column header menu selection payload
export interface ColumnHeaderMenuPayload {
  columnKey: string
  menuKey: string
}

// Special row update payload
export interface SpecialRowUpdatePayload {
  specialRowKey: string
  columnKey: string
  value: unknown
}

// Special row edit AI payload
export interface SpecialRowEditAiPayload {
  specialRowKey: string
  columnKey: string
}
