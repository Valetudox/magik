<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, h } from 'vue'
import { useListPage } from '../composables/useListPage'
import type { ListPageConfig, RowActionConfig, BulkActionConfig } from '../types/list-page.schema'
import AppHeader from '../components/AppHeader.vue'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog.vue'
import BulkOperationProgress from '../components/BulkOperationProgress.vue'
import BulkActionsToolbar from '../components/list-page/BulkActionsToolbar.vue'

interface Props {
  config: ListPageConfig<T>
}

const props = defineProps<Props>()

// Use the composable for business logic
const {
  items,
  loading,
  error,
  search,
  selectedIds,
  selectedItems,
  showCreateDialog,
  showDeleteDialog,
  deleteTarget,
  deleting,
  bulkOperationInProgress,
  bulkOperationProgress,
  loadItems,
  createItem,
  confirmDelete,
  handleDelete,
  navigateToDetail,
} = useListPage<T>(props.config)

// Generate table headers from config
const tableHeaders = computed(() => {
  const headers = props.config.fields.map(field => ({
    title: field.title,
    key: field.key,
    sortable: field.sortable ?? false,
    align: field.align || 'start',
    width: field.width
  }))

  // Add actions column if there are row actions
  if (props.config.rowActions && props.config.rowActions.length > 0) {
    headers.push({
      title: 'Actions',
      key: 'actions',
      sortable: false,
      align: 'center' as const,
      width: undefined
    })
  }

  return headers
})

// Handle row action click
const handleRowAction = (action: RowActionConfig<T>, item: T) => {
  switch (action.type) {
    case 'delete':
      confirmDelete(item)
      break
    case 'view':
      navigateToDetail(item)
      break
    case 'custom':
      if (action.onClick) {
        void action.onClick(item)
      }
      break
  }
}

// Handle bulk action click
const handleBulkAction = (action: BulkActionConfig<T>) => {
  switch (action.type) {
    case 'delete':
      confirmDelete()
      break
    case 'custom':
      if (action.onClick) {
        void action.onClick(selectedIds.value, selectedItems.value)
      }
      break
  }
}

// Render field value based on config
const renderFieldValue = (field: typeof props.config.fields[0], item: T) => {
  const value = item[field.key as keyof T]

  // Priority 1: Custom renderer
  if (field.renderer) {
    return field.renderer(value, item)
  }

  // Priority 2: Formatter
  if (field.formatter) {
    return field.formatter(value, item)
  }

  // Priority 3: Raw value
  return value
}
</script>

<template>
  <div class="entity-list-page">
    <!-- App header with page title -->
    <AppHeader>
      <template #title>
        <v-breadcrumbs :items="[{ title: config.pageTitle, disabled: true }]" density="compact" class="pa-0" />
      </template>
    </AppHeader>

    <!-- Main content -->
    <v-container fluid>
      <!-- Loading state -->
      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4 text-h6">Loading {{ config.entityNamePlural }}...</p>
        </v-col>
      </v-row>

      <!-- Error state -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>

      <!-- Data table -->
      <v-row v-else>
        <v-col cols="12">
          <v-card>
            <v-card-title v-if="config.enableSearch || config.createAction?.enabled">
              <div class="d-flex align-center ga-4 w-100">
                <v-text-field
                  v-if="config.enableSearch"
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  :label="`Search ${config.entityNamePlural}`"
                  single-line
                  hide-details
                  clearable
                  variant="outlined"
                  density="compact"
                  class="flex-grow-1"
                />
                <v-btn
                  v-if="config.createAction?.enabled"
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="showCreateDialog = true"
                >
                  {{ config.createAction.label || `New ${config.entityName}` }}
                </v-btn>
              </div>
            </v-card-title>

            <v-data-table
              v-model="selectedIds"
              :headers="tableHeaders"
              :items="items"
              :search="search"
              :items-per-page="config.itemsPerPage || 50"
              :sort-by="config.defaultSort"
              :item-value="config.entityId"
              :show-select="config.enableSelection"
              select-strategy="page"
              hover
            >
              <!-- Dynamic field slots -->
              <template
                v-for="field in config.fields"
                #[`item.${field.key}`]="{ item }"
                :key="field.key"
              >
                <slot
                  :name="`field-${field.key}`"
                  :item="item"
                  :value="item[field.key]"
                >
                  <component
                    :is="renderFieldValue(field, item)"
                    v-if="field.renderer"
                  />
                  <span v-else>
                    {{ renderFieldValue(field, item) }}
                  </span>
                </slot>
              </template>

              <!-- Row actions slot -->
              <template
                v-if="config.rowActions && config.rowActions.length > 0"
                #[`item.actions`]="{ item }"
              >
                <div class="action-buttons">
                  <v-btn
                    v-for="(action, idx) in config.rowActions"
                    :key="idx"
                    :icon="action.icon"
                    size="small"
                    variant="text"
                    :color="action.color"
                    :title="action.title"
                    :disabled="action.disabled?.(item)"
                    @click="handleRowAction(action, item)"
                  />
                </div>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Bulk actions toolbar -->
    <BulkActionsToolbar
      v-if="config.enableSelection && config.bulkActions"
      :selected-count="selectedIds.length"
      :actions="config.bulkActions"
      :entity-name="config.entityName"
      :selected-ids="selectedIds"
      :selected-items="selectedItems"
      @clear="selectedIds = []"
      @action="handleBulkAction"
    />

    <!-- Delete confirmation dialog -->
    <DeleteConfirmDialog
      v-model="showDeleteDialog"
      :entity-name="config.entityName"
      :target="deleteTarget"
      :selected-count="selectedIds.length"
      :deleting="deleting"
      :confirm-message="config.deleteDialog?.confirmMessage"
      :bulk-confirm-message="config.deleteDialog?.bulkConfirmMessage"
      @confirm="handleDelete"
    />

    <!-- Bulk operation progress -->
    <BulkOperationProgress
      v-model="bulkOperationInProgress"
      :progress="bulkOperationProgress"
      :operation-name="`Deleting ${config.entityNamePlural}`"
    />

    <!-- Create dialog slot -->
    <slot
      name="create-dialog"
      :show="showCreateDialog"
      :on-close="() => (showCreateDialog = false)"
      :on-create="createItem"
    >
      <component
        v-if="config.createAction?.enabled && 'dialogComponent' in config.createAction && config.createAction.dialogComponent"
        :is="config.createAction.dialogComponent"
        v-model="showCreateDialog"
        @create="createItem"
      />
    </slot>
  </div>
</template>

<style scoped>
.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
