<script setup lang="ts">
import { ref } from 'vue'
import type { MermaidCellConfigInput } from '../../types/detail-table.schema'
import ClickMenu, { type ClickMenuItem } from '../ClickMenu.vue'
import TextEditDialog from '../TextEditDialog.vue'

const props = defineProps<{
  value: string | null | undefined
  config: MermaidCellConfigInput
  editable?: boolean
}>()

const emit = defineEmits<{
  update: [value: string]
  'edit-ai': []
}>()

const dialogOpen = ref(false)

const menuItems: ClickMenuItem[] = [
  { key: 'edit', icon: 'mdi-pencil', title: 'Edit Diagram' },
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
    <div class="mermaid-cell">
      <template v-if="value">
        <pre class="mermaid-code">{{ value }}</pre>
      </template>
      <span v-else class="text-grey text-caption">No diagram</span>
    </div>
  </ClickMenu>
  <div v-else class="mermaid-cell">
    <template v-if="value">
      <pre class="mermaid-code">{{ value }}</pre>
    </template>
    <span v-else class="text-grey text-caption">No diagram</span>
  </div>

  <TextEditDialog
    v-model="dialogOpen"
    :title="`Edit ${config.header}`"
    :initial-value="value ?? ''"
    :multiline="true"
    @save="handleSave"
  />
</template>

<style scoped>
.mermaid-cell {
  padding: 8px;
  min-height: 40px;
  cursor: pointer;
}

.mermaid-code {
  font-size: 0.75em;
  background: rgba(0, 0, 0, 0.1);
  padding: 8px;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
  margin: 0;
}
</style>
