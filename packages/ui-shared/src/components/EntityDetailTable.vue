<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type {
  DetailTableConfigInput,
  CellConfigInput,
  CellUpdatePayload,
  EditAiPayload,
  RowHeaderMenuPayload,
  ColumnHeaderMenuPayload,
  SpecialRowUpdatePayload,
  SpecialRowEditAiPayload,
  SpecialRow,
} from '../types/detail-table.schema'
import TextCell from './detail-table/TextCell.vue'
import ListCell from './detail-table/ListCell.vue'
import MermaidCell from './detail-table/MermaidCell.vue'
import CellWithRating from './detail-table/CellWithRating.vue'
import ClickMenu from './ClickMenu.vue'

const props = withDefaults(
  defineProps<{
    config: DetailTableConfigInput
    rows: Record<string, unknown>[]
    columnData?: Record<string, Record<string, unknown>> // For special rows
    loading?: boolean
  }>(),
  {
    loading: false,
  }
)

const emit = defineEmits<{
  'update:cell': [payload: CellUpdatePayload]
  'edit-ai': [payload: EditAiPayload]
  'row-header:menu': [payload: RowHeaderMenuPayload]
  'column-header:menu': [payload: ColumnHeaderMenuPayload]
  'update:special-row': [payload: SpecialRowUpdatePayload]
  'edit-ai:special-row': [payload: SpecialRowEditAiPayload]
}>()

const slots = useSlots()

// Get cell value from row
const getCellValue = (row: Record<string, unknown>, key: string): unknown => {
  return row[key]
}

// Get row key value
const getRowKey = (row: Record<string, unknown>): string => {
  return String(row[props.config.rowKey] ?? '')
}

// Get row header value
const getRowHeaderValue = (row: Record<string, unknown>): string => {
  if (!props.config.rowHeader) return ''
  return String(row[props.config.rowHeader.key] ?? '')
}

// Get tooltip value for row header
const getRowHeaderTooltip = (row: Record<string, unknown>): string | null => {
  if (!props.config.rowHeader?.tooltip) return null
  return String(row[props.config.rowHeader.tooltip] ?? '')
}

// Handle cell update
const handleCellUpdate = (row: Record<string, unknown>, columnKey: string, value: unknown) => {
  emit('update:cell', {
    rowKey: getRowKey(row),
    columnKey,
    value,
  })
}

// Handle edit with AI
const handleEditAi = (row: Record<string, unknown>, columnKey: string) => {
  emit('edit-ai', {
    rowKey: getRowKey(row),
    columnKey,
  })
}

// Handle row header menu selection
const handleRowHeaderMenu = (row: Record<string, unknown>, menuKey: string) => {
  emit('row-header:menu', {
    rowKey: getRowKey(row),
    menuKey,
    row,
  })
}

// Handle column header menu selection
const handleColumnHeaderMenu = (columnKey: string, menuKey: string) => {
  emit('column-header:menu', {
    columnKey,
    menuKey,
  })
}

// Handle special row update
const handleSpecialRowUpdate = (specialRowKey: string, columnKey: string, value: unknown) => {
  emit('update:special-row', {
    specialRowKey,
    columnKey,
    value,
  })
}

// Handle special row edit AI
const handleSpecialRowEditAi = (specialRowKey: string, columnKey: string) => {
  emit('edit-ai:special-row', {
    specialRowKey,
    columnKey,
  })
}

// Get special row cell value from columnData
const getSpecialRowValue = (columnKey: string, fieldKey: string): unknown => {
  return props.columnData?.[columnKey]?.[fieldKey]
}

// Check if slot exists for custom cell
const hasCustomSlot = (slotName: string): boolean => {
  return !!slots[`cell-${slotName}`]
}

// Check if slot exists for special row custom cell
const hasSpecialRowSlot = (slotName: string): boolean => {
  return !!slots[`special-${slotName}`]
}

// Check if color is a Vuetify theme color
const isThemeColor = (color: string) => {
  return ['primary', 'secondary', 'success', 'warning', 'error', 'info'].includes(color)
}

// Compute column widths
const columnWidths = computed(() => {
  const hasRowHeader = !!props.config.rowHeader
  const numCols = props.config.columns.length + (hasRowHeader ? 1 : 0)
  const rowHeaderWidth = props.config.rowHeader?.width ?? '15%'

  // Calculate remaining width for other columns
  const otherColumnWidth = hasRowHeader
    ? `${(100 - parseInt(rowHeaderWidth)) / props.config.columns.length}%`
    : `${100 / numCols}%`

  return {
    rowHeader: rowHeaderWidth,
    column: otherColumnWidth,
  }
})
</script>

<template>
  <v-card :loading="loading">
    <slot name="title" />

    <v-card-text>
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="rows.length === 0 && !config.specialRows?.length" class="text-center py-8 text-grey">
        <slot name="empty">{{ config.emptyText }}</slot>
      </div>

      <v-table v-else class="detail-table">
        <thead>
          <tr>
            <!-- Row header column header -->
            <th
              v-if="config.rowHeader"
              class="text-left"
              :style="{ width: columnWidths.rowHeader }"
            >
              {{ config.rowHeader.header }}
            </th>

            <!-- Column headers with menu and badge -->
            <th
              v-for="col in config.columns"
              :key="col.key"
              class="text-left column-header"
              :style="{ width: col.width ?? columnWidths.column }"
            >
              <div class="column-header-content">
                <ClickMenu
                  v-if="col.headerMenu && col.headerMenu.length > 0"
                  :items="col.headerMenu"
                  @select="handleColumnHeaderMenu(col.key, $event)"
                >
                  <span class="column-header-text">{{ col.header }}</span>
                </ClickMenu>
                <span v-else class="column-header-text">{{ col.header }}</span>

                <v-chip
                  v-if="col.headerBadge"
                  :color="isThemeColor(col.headerBadge.color) ? col.headerBadge.color : undefined"
                  :style="!isThemeColor(col.headerBadge.color) ? { backgroundColor: col.headerBadge.color } : undefined"
                  size="small"
                  variant="tonal"
                  class="ml-2"
                >
                  <v-icon v-if="col.headerBadge.icon" :icon="col.headerBadge.icon" start size="small" />
                  {{ col.headerBadge.label }}
                </v-chip>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Special rows (before data rows) -->
          <tr v-for="specialRow in config.specialRows" :key="specialRow.key" class="special-row">
            <!-- Row header for special row -->
            <th
              v-if="config.rowHeader"
              class="row-header-cell"
              :style="{ width: columnWidths.rowHeader }"
            >
              {{ specialRow.header }}
            </th>

            <!-- Special row cells -->
            <td
              v-for="col in config.columns"
              :key="col.key"
              :style="{ width: col.width ?? columnWidths.column }"
              class="data-cell"
            >
              <!-- Text special cell -->
              <TextCell
                v-if="specialRow.type === 'text'"
                :value="getSpecialRowValue(col.key, specialRow.fieldKey) as string | null | undefined"
                :config="{ type: 'text', key: specialRow.fieldKey, header: specialRow.header }"
                :editable="config.editable"
                @update="handleSpecialRowUpdate(specialRow.key, col.key, $event)"
                @edit-ai="handleSpecialRowEditAi(specialRow.key, col.key)"
              />

              <!-- Mermaid special cell -->
              <MermaidCell
                v-else-if="specialRow.type === 'mermaid'"
                :value="getSpecialRowValue(col.key, specialRow.fieldKey) as string | null | undefined"
                :config="{ type: 'mermaid', key: specialRow.fieldKey, header: specialRow.header }"
                :editable="config.editable"
                @update="handleSpecialRowUpdate(specialRow.key, col.key, $event)"
                @edit-ai="handleSpecialRowEditAi(specialRow.key, col.key)"
              />

              <!-- Custom special cell -->
              <template v-else-if="specialRow.type === 'custom' && specialRow.slotName && hasSpecialRowSlot(specialRow.slotName)">
                <slot
                  :name="`special-${specialRow.slotName}`"
                  :special-row="specialRow"
                  :column="col"
                  :value="getSpecialRowValue(col.key, specialRow.fieldKey)"
                  :on-update="(value: unknown) => handleSpecialRowUpdate(specialRow.key, col.key, value)"
                  :on-edit-ai="() => handleSpecialRowEditAi(specialRow.key, col.key)"
                />
              </template>

              <!-- Fallback -->
              <span v-else class="text-grey fallback-cell">
                {{ getSpecialRowValue(col.key, specialRow.fieldKey) ?? '-' }}
              </span>
            </td>
          </tr>

          <!-- Data rows -->
          <tr v-for="row in rows" :key="getRowKey(row)">
            <!-- Row header cell with tooltip and menu -->
            <td
              v-if="config.rowHeader"
              class="row-header-cell"
              :style="{ width: columnWidths.rowHeader }"
            >
              <ClickMenu
                v-if="config.rowHeader.menu && config.rowHeader.menu.length > 0"
                :items="config.rowHeader.menu"
                @select="handleRowHeaderMenu(row, $event)"
              >
                <v-tooltip v-if="config.rowHeader.tooltip" location="right">
                  <template #activator="{ props: tooltipProps }">
                    <span v-bind="tooltipProps" class="row-header-text">
                      {{ getRowHeaderValue(row) }}
                    </span>
                  </template>
                  <div class="tooltip-content">
                    {{ getRowHeaderTooltip(row) }}
                  </div>
                </v-tooltip>
                <span v-else class="row-header-text">
                  {{ getRowHeaderValue(row) }}
                </span>
              </ClickMenu>
              <template v-else>
                <v-tooltip v-if="config.rowHeader.tooltip" location="right">
                  <template #activator="{ props: tooltipProps }">
                    <span v-bind="tooltipProps" class="row-header-text">
                      {{ getRowHeaderValue(row) }}
                    </span>
                  </template>
                  <div class="tooltip-content">
                    {{ getRowHeaderTooltip(row) }}
                  </div>
                </v-tooltip>
                <slot v-else name="row-header" :row="row" :value="getRowHeaderValue(row)">
                  {{ getRowHeaderValue(row) }}
                </slot>
              </template>
            </td>

            <!-- Data cells -->
            <td
              v-for="col in config.columns"
              :key="col.key"
              :style="{ width: col.width ?? columnWidths.column }"
              class="data-cell"
            >
              <!-- Cell with rating bar -->
              <CellWithRating
                v-if="col.rating"
                :rating="col.rating"
                :rating-value="getCellValue(row, col.rating.key) as string | null | undefined"
                :editable="config.editable"
                :subtitle="`${col.header} / ${getRowHeaderValue(row)}`"
                @update:rating="handleCellUpdate(row, col.rating.key, $event)"
              >
                <!-- Nested cell content based on type -->
                <TextCell
                  v-if="col.type === 'text'"
                  :value="getCellValue(row, col.key) as string | null | undefined"
                  :config="col"
                  :editable="config.editable"
                  @update="handleCellUpdate(row, col.key, $event)"
                  @edit-ai="handleEditAi(row, col.key)"
                />
                <ListCell
                  v-else-if="col.type === 'list'"
                  :value="getCellValue(row, col.key) as string[] | null | undefined"
                  :config="col"
                  :editable="config.editable"
                  @update="handleCellUpdate(row, col.key, $event)"
                  @edit-ai="handleEditAi(row, col.key)"
                />
                <MermaidCell
                  v-else-if="col.type === 'mermaid'"
                  :value="getCellValue(row, col.key) as string | null | undefined"
                  :config="col"
                  :editable="config.editable"
                  @update="handleCellUpdate(row, col.key, $event)"
                  @edit-ai="handleEditAi(row, col.key)"
                />
                <template v-else-if="col.type === 'custom' && hasCustomSlot(col.slotName)">
                  <slot
                    :name="`cell-${col.slotName}`"
                    :row="row"
                    :column="col"
                    :value="getCellValue(row, col.key)"
                    :on-update="(value: unknown) => handleCellUpdate(row, col.key, value)"
                    :on-edit-ai="() => handleEditAi(row, col.key)"
                  />
                </template>
              </CellWithRating>

              <!-- Cell without rating bar -->
              <template v-else>
                <!-- Custom cell via slot -->
                <template v-if="col.type === 'custom' && hasCustomSlot(col.slotName)">
                  <slot
                    :name="`cell-${col.slotName}`"
                    :row="row"
                    :column="col"
                    :value="getCellValue(row, col.key)"
                    :on-update="(value: unknown) => handleCellUpdate(row, col.key, value)"
                    :on-edit-ai="() => handleEditAi(row, col.key)"
                  />
                </template>

                <!-- Text cell -->
                <TextCell
                  v-else-if="col.type === 'text'"
                  :value="getCellValue(row, col.key) as string | null | undefined"
                  :config="col"
                  :editable="config.editable"
                  @update="handleCellUpdate(row, col.key, $event)"
                  @edit-ai="handleEditAi(row, col.key)"
                />

                <!-- List cell -->
                <ListCell
                  v-else-if="col.type === 'list'"
                  :value="getCellValue(row, col.key) as string[] | null | undefined"
                  :config="col"
                  :editable="config.editable"
                  @update="handleCellUpdate(row, col.key, $event)"
                  @edit-ai="handleEditAi(row, col.key)"
                />

                <!-- Mermaid cell -->
                <MermaidCell
                  v-else-if="col.type === 'mermaid'"
                  :value="getCellValue(row, col.key) as string | null | undefined"
                  :config="col"
                  :editable="config.editable"
                  @update="handleCellUpdate(row, col.key, $event)"
                  @edit-ai="handleEditAi(row, col.key)"
                />

                <!-- Fallback for unknown types -->
                <span v-else class="text-grey fallback-cell">{{ getCellValue(row, col.key) ?? '-' }}</span>
              </template>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>

    <slot name="footer" />
  </v-card>
</template>

<style scoped>
.detail-table {
  table-layout: fixed;
  width: 100%;
}

.detail-table :deep(thead th) {
  background-color: rgba(var(--v-theme-primary), 0.1);
  font-weight: bold;
  padding: 12px !important;
}

.detail-table :deep(tbody td) {
  vertical-align: top;
  padding: 0 !important;
}

.column-header-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.column-header-text {
  cursor: pointer;
}

.column-header-text:hover {
  text-decoration: underline;
}

.row-header-cell {
  background-color: rgba(var(--v-theme-primary), 0.1);
  font-weight: bold;
  padding: 12px !important;
}

.row-header-text {
  cursor: pointer;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}

.row-header-text:hover {
  text-decoration: underline;
}

.tooltip-content {
  max-width: 300px;
}

.data-cell {
  padding: 0 !important;
}

.fallback-cell {
  display: block;
  padding: 8px;
}

.special-row {
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.2);
}
</style>
