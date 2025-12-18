<script setup lang="ts">
import { ref } from 'vue'
import Editable from './Editable.vue'
import TextEditDialog from './TextEditDialog.vue'
import ListEditDialog from './ListEditDialog.vue'

interface Props {
  title?: string
  type?: 'text' | 'list'
  value?: string
  items?: string[]
  editable?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  value: undefined,
  items: undefined,
  editable: true,
  emptyText: 'Double-click to add content...',
})

const emit = defineEmits<{
  update: [value: string | string[]]
  'edit-ai': []
}>()

const dialogOpen = ref(false)

const handleEdit = () => {
  dialogOpen.value = true
}

const handleSaveText = (newValue: string) => {
  emit('update', newValue)
}

const handleSaveList = (newValue: string[]) => {
  emit('update', newValue)
}

// Computed dialog title
const dialogTitle = props.title ? `Edit ${props.title}` : 'Edit'
</script>

<template>
  <Editable
    :editable="props.editable"
    @edit="handleEdit"
    @edit-ai="$emit('edit-ai')"
  >
    <div class="box-section">
      <p v-if="props.title" class="font-weight-bold mb-2">{{ props.title }}</p>
      <slot>
        <!-- Default content for text type -->
        <template v-if="type === 'text'">
          <span :class="{ 'empty-placeholder': !value }">
            {{ value || emptyText }}
          </span>
        </template>
        <!-- Default content for list type -->
        <template v-else-if="type === 'list'">
          <ul v-if="items && items.length > 0" class="list-content">
            <li v-for="(item, index) in items" :key="index">{{ item }}</li>
          </ul>
          <span v-else class="empty-placeholder">{{ emptyText }}</span>
        </template>
      </slot>
    </div>
  </Editable>

  <!-- Text edit dialog -->
  <TextEditDialog
    v-if="type === 'text'"
    v-model="dialogOpen"
    :title="dialogTitle"
    :value="value ?? ''"
    :multiline="true"
    @save="handleSaveText"
  />

  <!-- List edit dialog -->
  <ListEditDialog
    v-if="type === 'list'"
    v-model="dialogOpen"
    :title="dialogTitle"
    :items="items ?? []"
    @save="handleSaveList"
  />
</template>

<style scoped>
.box-section {
  padding: 4px;
  margin: -4px;
  border-radius: 4px;
}

.box-section:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.empty-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.list-content {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0;
}

.list-content li {
  margin-bottom: 8px;
  line-height: 1.4;
}
</style>
