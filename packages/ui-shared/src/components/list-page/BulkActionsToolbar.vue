<script setup lang="ts">
import type { BulkActionConfig } from '../../types/list-page.schema'

interface Props {
  selectedCount: number
  actions?: BulkActionConfig<any>[]
  entityName: string
  selectedIds: string[]
  selectedItems: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'clear': []
  'action': [action: BulkActionConfig<any>]
}>()

const handleClear = () => {
  emit('clear')
}

const handleAction = (action: BulkActionConfig<any>) => {
  emit('action', action)
}

const isActionDisabled = (action: BulkActionConfig<any>) => {
  if (action.disabled) {
    return action.disabled(props.selectedIds, props.selectedItems)
  }
  return false
}
</script>

<template>
  <v-expand-transition>
    <v-toolbar
      v-if="selectedCount > 0"
      color="primary"
      dark
      class="bulk-actions-toolbar"
      density="comfortable"
    >
      <v-toolbar-title>
        {{ selectedCount }} {{ selectedCount === 1 ? entityName : entityName + 's' }} selected
      </v-toolbar-title>

      <v-spacer />

      <v-btn
        variant="text"
        prepend-icon="mdi-close"
        @click="handleClear"
      >
        Clear Selection
      </v-btn>

      <v-btn
        v-for="(action, index) in actions"
        :key="index"
        variant="text"
        :prepend-icon="action.icon"
        :color="action.color"
        :disabled="isActionDisabled(action)"
        @click="handleAction(action)"
      >
        {{ action.label }}
      </v-btn>
    </v-toolbar>
  </v-expand-transition>
</template>

<style scoped>
.bulk-actions-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
</style>
