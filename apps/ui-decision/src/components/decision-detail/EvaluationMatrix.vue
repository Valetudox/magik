<script setup lang="ts">
import { computed } from 'vue'
import {
  EntityDetailTable,
  type DetailTableConfigInput,
  type CellUpdatePayload,
  type EditAiPayload,
  type RowHeaderMenuPayload,
  type ColumnHeaderMenuPayload,
  type SpecialRowUpdatePayload,
  type SpecialRowEditAiPayload,
} from '@magik/ui-shared'

export interface Option {
  id: string
  name: string
  description: string
  moreLink?: string
  architectureDiagramMermaid?: string
  architectureDiagramLink?: string
}

export interface Driver {
  id: string
  name: string
  description: string
}

export interface Evaluation {
  optionId: string
  driverId: string
  rating?: 'high' | 'medium' | 'low'
  evaluationDetails: string[]
}

const props = defineProps<{
  options: Option[]
  drivers: Driver[]
  evaluationMatrix: Evaluation[]
  selectedOption?: string | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'add-option': []
  'add-driver': []
  'edit-option': [option: Option]
  'delete-option': [option: Option]
  'select-option': [optionId: string | null]
  'edit-driver': [driver: Driver]
  'delete-driver': [driver: Driver]
  'update-rating': [optionId: string, driverId: string, rating: 'high' | 'medium' | 'low' | null]
  'update-evaluation-details': [optionId: string, driverId: string, details: string[]]
  'update-option-description': [optionId: string, description: string]
  'update-option-diagram': [optionId: string, diagram: string]
  'edit-ai': [context: { type: 'evaluation' | 'description' | 'diagram'; optionName: string; driverName?: string }]
}>()

const hasAnyDiagram = computed(() => {
  return props.options.some(
    (option) => option.architectureDiagramMermaid ?? option.architectureDiagramLink
  )
})

const tableConfig = computed<DetailTableConfigInput>(() => {
  const specialRows: DetailTableConfigInput['specialRows'] = [
    { key: 'description', header: 'Description', type: 'text', fieldKey: 'description' },
  ]

  if (hasAnyDiagram.value) {
    specialRows.push({ key: 'diagram', header: 'Architecture Diagram', type: 'mermaid', fieldKey: 'architectureDiagramMermaid' })
  }

  return {
    rowKey: 'driverId',
    rowHeader: {
      key: 'driverName',
      header: '',
      width: '15%',
      tooltip: 'driverDescription',
      menu: [
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
        { key: 'delete', icon: 'mdi-delete', title: 'Remove', class: 'text-error' },
      ],
    },
    columns: props.options.map((option) => ({
      type: 'list' as const,
      key: `option-${option.id}`,
      header: option.name,
      editable: true,
      headerMenu: [
        props.selectedOption === option.id
          ? { key: 'clearSelection', icon: 'mdi-close-circle-outline', title: 'Clear selection' }
          : { key: 'select', icon: 'mdi-check-circle-outline', title: 'Select' },
        { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
        { key: 'delete', icon: 'mdi-delete', title: 'Remove', class: 'text-error' },
      ],
      headerBadge: props.selectedOption === option.id
        ? { label: 'Selected', color: 'success', icon: 'mdi-check-circle' }
        : undefined,
      rating: {
        key: `rating-${option.id}`,
        levels: [
          { key: 'high', label: 'High', color: 'success' },
          { key: 'medium', label: 'Medium', color: 'warning' },
          { key: 'low', label: 'Low', color: 'error' },
        ],
        allowEmpty: true,
        emptyLabel: 'Not rated',
      },
    })),
    specialRows,
    editable: true,
    emptyText: 'No drivers defined. Add a driver to start evaluating options.',
  }
})

const tableRows = computed(() => {
  return props.drivers.map((driver) => {
    const row: Record<string, unknown> = {
      driverId: driver.id,
      driverName: driver.name,
      driverDescription: driver.description,
    }

    for (const option of props.options) {
      const evaluation = props.evaluationMatrix.find(
        (e) => e.optionId === option.id && e.driverId === driver.id
      )
      row[`option-${option.id}`] = evaluation?.evaluationDetails ?? []
      row[`rating-${option.id}`] = evaluation?.rating ?? null
    }

    return row
  })
})

const columnData = computed(() => {
  const data: Record<string, Record<string, unknown>> = {}

  for (const option of props.options) {
    data[`option-${option.id}`] = {
      description: option.description,
      architectureDiagramMermaid: option.architectureDiagramMermaid,
    }
  }

  return data
})

const handleCellUpdate = (payload: CellUpdatePayload) => {
  const { rowKey, columnKey, value } = payload

  if (columnKey.startsWith('rating-')) {
    const optionId = columnKey.replace('rating-', '')
    emit('update-rating', optionId, rowKey, value as 'high' | 'medium' | 'low' | null)
    return
  }

  if (columnKey.startsWith('option-')) {
    const optionId = columnKey.replace('option-', '')
    emit('update-evaluation-details', optionId, rowKey, value as string[])
  }
}

const handleEditAi = (payload: EditAiPayload) => {
  const { rowKey, columnKey } = payload
  const driver = props.drivers.find((d) => d.id === rowKey)
  const optionId = columnKey.replace('option-', '').replace('rating-', '')
  const option = props.options.find((o) => o.id === optionId)

  if (driver && option) {
    emit('edit-ai', { type: 'evaluation', optionName: option.name, driverName: driver.name })
  }
}

const handleRowHeaderMenu = (payload: RowHeaderMenuPayload) => {
  const { rowKey, menuKey } = payload
  const driver = props.drivers.find((d) => d.id === rowKey)
  if (!driver) return

  if (menuKey === 'edit') {
    emit('edit-driver', driver)
  } else if (menuKey === 'delete') {
    emit('delete-driver', driver)
  }
}

const handleColumnHeaderMenu = (payload: ColumnHeaderMenuPayload) => {
  const { columnKey, menuKey } = payload
  const optionId = columnKey.replace('option-', '')
  const option = props.options.find((o) => o.id === optionId)
  if (!option) return

  switch (menuKey) {
    case 'select':
      emit('select-option', option.id)
      break
    case 'clearSelection':
      emit('select-option', null)
      break
    case 'edit':
      emit('edit-option', option)
      break
    case 'delete':
      emit('delete-option', option)
      break
  }
}

const handleSpecialRowUpdate = (payload: SpecialRowUpdatePayload) => {
  const { specialRowKey, columnKey, value } = payload
  const optionId = columnKey.replace('option-', '')

  if (specialRowKey === 'description') {
    emit('update-option-description', optionId, value as string)
  } else if (specialRowKey === 'diagram') {
    emit('update-option-diagram', optionId, value as string)
  }
}

const handleSpecialRowEditAi = (payload: SpecialRowEditAiPayload) => {
  const { specialRowKey, columnKey } = payload
  const optionId = columnKey.replace('option-', '')
  const option = props.options.find((o) => o.id === optionId)
  if (!option) return

  if (specialRowKey === 'description') {
    emit('edit-ai', { type: 'description', optionName: option.name })
  } else if (specialRowKey === 'diagram') {
    emit('edit-ai', { type: 'diagram', optionName: option.name })
  }
}
</script>

<template>
  <EntityDetailTable
    :config="tableConfig"
    :rows="tableRows"
    :column-data="columnData"
    :loading="loading"
    @update:cell="handleCellUpdate"
    @edit-ai="handleEditAi"
    @row-header:menu="handleRowHeaderMenu"
    @column-header:menu="handleColumnHeaderMenu"
    @update:special-row="handleSpecialRowUpdate"
    @edit-ai:special-row="handleSpecialRowEditAi"
  >
    <template #title>
      <v-card-title class="d-flex align-center">
        <span>Evaluation Matrix</span>
        <v-spacer />
        <v-btn
          variant="tonal"
          color="primary"
          size="small"
          prepend-icon="mdi-plus"
          class="mr-2"
          @click="$emit('add-option')"
        >
          Add Option
        </v-btn>
        <v-btn
          variant="tonal"
          color="primary"
          size="small"
          prepend-icon="mdi-plus"
          @click="$emit('add-driver')"
        >
          Add Driver
        </v-btn>
      </v-card-title>
    </template>

    <template #footer>
      <v-card-text class="pt-0">
        <div class="rating-legend">
          <div class="legend-item">
            <span class="legend-dot success" />
            <span class="legend-text">Green - Meets requirements well / Good fit / Low risk</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot warning" />
            <span class="legend-text">Yellow - Partially meets requirements / Acceptable with trade-offs / Medium risk</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot error" />
            <span class="legend-text">Red - Does not meet requirements / Significant concerns / High risk</span>
          </div>
        </div>
      </v-card-text>
    </template>
  </EntityDetailTable>
</template>

<style scoped>
.rating-legend {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.success {
  background-color: rgb(var(--v-theme-success));
}

.legend-dot.warning {
  background-color: rgb(var(--v-theme-warning));
}

.legend-dot.error {
  background-color: rgb(var(--v-theme-error));
}

.legend-text {
  font-size: 0.875rem;
  color: white;
}
</style>
