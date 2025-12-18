<script setup lang="ts">
import { ref } from 'vue'
import { ListBox, NameDescriptionDialog } from '@magik/ui-shared'
import ConfirmDialog from '../ConfirmDialog.vue'

export interface UseCaseItem {
  id: string
  name: string
  description: string
}

defineProps<{
  useCases: UseCaseItem[]
}>()

const emit = defineEmits<{
  create: [data: { name: string; description: string }]
  update: [id: string, data: { name: string; description: string }]
  delete: [id: string]
  'edit-ai': [useCase: UseCaseItem]
}>()

// Dialog state
const showDialog = ref(false)
const showConfirmDialog = ref(false)
const editingItem = ref<UseCaseItem | null>(null)
const deletingItem = ref<UseCaseItem | null>(null)

const openAddDialog = () => {
  editingItem.value = null
  showDialog.value = true
}

const openEditDialog = (useCase: UseCaseItem) => {
  editingItem.value = useCase
  showDialog.value = true
}

const handleSave = (data: { name: string; description: string }) => {
  if (editingItem.value) {
    emit('update', editingItem.value.id, data)
  } else {
    emit('create', data)
  }
}

const confirmDelete = (useCase: UseCaseItem) => {
  deletingItem.value = useCase
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
    title="Use Cases"
    class="mb-4"
    empty-text="No use cases yet. Click + to add one."
    @add="openAddDialog"
  >
    <template v-if="useCases && useCases.length > 0">
      <v-card
        v-for="useCase in useCases"
        :key="useCase.id"
        variant="outlined"
        class="mb-2"
      >
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-menu>
            <template #activator="{ props }">
              <span
                v-bind="props"
                class="clickable-header"
                @dblclick.stop="openEditDialog(useCase)"
              >{{ useCase.name }}</span>
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-pencil"
                title="Edit"
                @click="openEditDialog(useCase)"
              />
              <v-list-item
                prepend-icon="mdi-robot"
                title="Edit with AI"
                @click="emit('edit-ai', useCase)"
              />
              <v-list-item
                prepend-icon="mdi-delete"
                title="Delete"
                @click="confirmDelete(useCase)"
              />
            </v-list>
          </v-menu>
        </v-card-title>
        <v-card-text>{{ useCase.description }}</v-card-text>
      </v-card>
    </template>
  </ListBox>

  <NameDescriptionDialog
    v-model="showDialog"
    entity-name="Use Case"
    :edit-item="editingItem"
    @save="handleSave"
  />

  <ConfirmDialog
    v-model="showConfirmDialog"
    title="Delete Use Case"
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
