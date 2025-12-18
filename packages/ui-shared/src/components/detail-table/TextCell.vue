<script setup lang="ts">
import { ref } from 'vue'
import type { TextCellConfigInput } from '../../types/detail-table.schema'
import ClickMenu, { type ClickMenuItem } from '../ClickMenu.vue'
import TextEditDialog from '../TextEditDialog.vue'

const props = defineProps<{
  value: string | null | undefined
  config: TextCellConfigInput
  editable?: boolean
}>()

const emit = defineEmits<{
  update: [value: string]
  'edit-ai': []
}>()

const dialogOpen = ref(false)

const menuItems: ClickMenuItem[] = [
  { key: 'edit', icon: 'mdi-pencil', title: 'Edit' },
  { key: 'edit-ai', icon: 'mdi-robot', title: 'Edit with AI' },
]

const handleMenuSelect = (key: string) => {
  if (key === 'edit') {
    dialogOpen.value = true
  } else if (key === 'edit-ai') {
    emit('edit-ai')
  }
}

const handleSave = (newValue: string) => {
  emit('update', newValue)
}
</script>

<template>
  <ClickMenu
    v-if="editable && config.editable"
    :items="menuItems"
    @select="handleMenuSelect"
  >
    <div class="text-cell">
      <span v-if="value" :class="{ 'text-multiline': config.multiline }">{{ value }}</span>
      <span v-else class="text-grey text-caption">Empty</span>
    </div>
  </ClickMenu>
  <div v-else class="text-cell">
    <span v-if="value" :class="{ 'text-multiline': config.multiline }">{{ value }}</span>
    <span v-else class="text-grey text-caption">Empty</span>
  </div>

  <TextEditDialog
    v-model="dialogOpen"
    :title="`Edit ${config.header}`"
    :initial-value="value ?? ''"
    :multiline="config.multiline"
    @save="handleSave"
  />
</template>

<style scoped>
.text-cell {
  padding: 8px;
  min-height: 40px;
  cursor: pointer;
}

.text-multiline {
  white-space: pre-wrap;
}
</style>
