<script setup lang="ts">
import { ref } from 'vue'
import { ListBox, NameDescriptionDialog } from '@magik/ui-shared'
import ConfirmDialog from '../ConfirmDialog.vue'

export interface ComponentItem {
  id: string
  name: string
  description: string
}

defineProps<{
  components: ComponentItem[]
}>()

const emit = defineEmits<{
  create: [data: { name: string; description: string }]
  update: [id: string, data: { name: string; description: string }]
  delete: [id: string]
  'edit-ai': [component: ComponentItem]
}>()

// Dialog state
const showDialog = ref(false)
const showConfirmDialog = ref(false)
const editingItem = ref<ComponentItem | null>(null)
const deletingItem = ref<ComponentItem | null>(null)

const openAddDialog = () => {
  editingItem.value = null
  showDialog.value = true
}

const openEditDialog = (component: ComponentItem) => {
  editingItem.value = component
  showDialog.value = true
}

const handleSave = (data: { name: string; description: string }) => {
  if (editingItem.value) {
    emit('update', editingItem.value.id, data)
  } else {
    emit('create', data)
  }
}

const confirmDelete = (component: ComponentItem) => {
  deletingItem.value = component
  showConfirmDialog.value = true
}

const handleDelete = () => {
  if (deletingItem.value) {
    emit('delete', deletingItem.value.id)
  }
}
</script>

<template>
  <ListBox
    title="Components"
    class="mb-4"
    empty-text="No components yet. Click + to add one."
    @add="openAddDialog"
  >
    <template v-if="components && components.length > 0">
      <v-card
        v-for="component in components"
        :key="component.id"
        variant="outlined"
        class="mb-2"
      >
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-menu>
            <template #activator="{ props }">
              <span
                v-bind="props"
                class="clickable-header"
                @dblclick.stop="openEditDialog(component)"
              >{{ component.name }}</span>
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-pencil"
                title="Edit"
                @click="openEditDialog(component)"
              />
              <v-list-item
                prepend-icon="mdi-robot"
                title="Edit with AI"
                @click="emit('edit-ai', component)"
              />
              <v-list-item
                prepend-icon="mdi-delete"
                title="Delete"
                @click="confirmDelete(component)"
              />
            </v-list>
          </v-menu>
        </v-card-title>
        <v-card-text>{{ component.description }}</v-card-text>
      </v-card>
    </template>
  </ListBox>

  <NameDescriptionDialog
    v-model="showDialog"
    entity-name="Component"
    :edit-item="editingItem"
    @save="handleSave"
  />

  <ConfirmDialog
    v-model="showConfirmDialog"
    title="Delete Component"
    :message="`Are you sure you want to delete '${deletingItem?.name}'?`"
    @confirm="handleDelete"
  />
</template>

<style scoped>
.clickable-header {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 6px;
  margin: -2px -6px;
  transition: background-color 0.15s ease;
}

.clickable-header:hover {
  background-color: rgba(var(--v-theme-primary), 0.15);
}
</style>
