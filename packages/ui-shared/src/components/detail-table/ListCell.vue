<script setup lang="ts">
import { ref } from 'vue'
import type { ListCellConfigInput } from '../../types/detail-table.schema'
import ClickMenu, { type ClickMenuItem } from '../ClickMenu.vue'
import ListEditDialog from '../ListEditDialog.vue'

defineProps<{
  value: string[] | null | undefined
  config: ListCellConfigInput
  editable?: boolean
}>()

const emit = defineEmits<{
  update: [value: string[]]
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

const handleSave = (newValue: string[]) => {
  emit('update', newValue)
}
</script>

<template>
  <ClickMenu
    v-if="editable && config.editable !== false"
    :items="menuItems"
    @select="handleMenuSelect"
  >
    <div class="list-cell">
      <template v-if="value && value.length > 0">
        <ul class="list-items">
          <li v-for="(item, index) in value" :key="index">{{ item }}</li>
        </ul>
      </template>
      <span v-else class="text-grey text-caption">No items</span>
    </div>
  </ClickMenu>
  <div v-else class="list-cell">
    <template v-if="value && value.length > 0">
      <ul class="list-items">
        <li v-for="(item, index) in value" :key="index">{{ item }}</li>
      </ul>
    </template>
    <span v-else class="text-grey text-caption">No items</span>
  </div>

  <ListEditDialog
    v-model="dialogOpen"
    :title="`Edit ${config.header}`"
    :items="value ?? []"
    @save="handleSave"
  />
</template>

<style scoped>
.list-cell {
  padding: 8px;
  min-height: 40px;
  cursor: pointer;
}

.list-items {
  margin: 0;
  padding-left: 20px;
}

.list-items li {
  margin-bottom: 2px;
}
</style>
