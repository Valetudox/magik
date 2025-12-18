<script setup lang="ts">
import { ref } from 'vue'
import type { MermaidCellConfigInput } from '../../types/detail-table.schema'
import ClickMenu, { type ClickMenuItem } from '../ClickMenu.vue'
import MermaidEditDialog from '../MermaidEditDialog.vue'
import { VueMermaidRender } from 'vue-mermaid-render'

// Mermaid configuration - white nodes, black borders
const mermaidConfig = {
  theme: 'base' as const,
  themeVariables: {
    primaryColor: '#ffffff',
    primaryTextColor: '#000000',
    primaryBorderColor: '#000000',
    secondaryColor: '#ffffff',
    secondaryTextColor: '#000000',
    secondaryBorderColor: '#000000',
    tertiaryColor: '#ffffff',
    tertiaryTextColor: '#000000',
    tertiaryBorderColor: '#000000',
    lineColor: '#000000',
    nodeBkg: '#ffffff',
    nodeBorder: '#000000',
    mainBkg: '#ffffff',
  },
}

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
    v-if="editable && config.editable !== false"
    :items="menuItems"
    @select="handleMenuSelect"
  >
    <div class="mermaid-cell">
      <template v-if="value">
        <div class="diagram-container">
          <VueMermaidRender :content="value" :config="mermaidConfig" />
        </div>
      </template>
      <span v-else class="text-grey text-caption">No diagram</span>
    </div>
  </ClickMenu>
  <div v-else class="mermaid-cell">
    <template v-if="value">
      <div class="diagram-container">
        <VueMermaidRender :content="value" :config="mermaidConfig" />
      </div>
    </template>
    <span v-else class="text-grey text-caption">No diagram</span>
  </div>

  <MermaidEditDialog
    v-model="dialogOpen"
    :title="`Edit ${config.header}`"
    :value="value ?? ''"
    @save="handleSave"
  />
</template>

<style scoped>
.mermaid-cell {
  padding: 8px;
  min-height: 40px;
  cursor: pointer;
}

.diagram-container {
  max-width: 100%;
  overflow: auto;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
}

.diagram-container :deep(svg) {
  max-width: 100%;
  height: auto;
}

</style>
