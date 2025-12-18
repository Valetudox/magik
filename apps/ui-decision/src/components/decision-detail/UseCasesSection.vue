<script setup lang="ts">
import { ListBox } from '@magik/ui-shared'

export interface UseCaseItem {
  id: string
  name: string
  description: string
}

defineProps<{
  useCases: UseCaseItem[]
}>()

defineEmits<{
  add: []
  edit: [useCase: UseCaseItem]
  delete: [useCase: UseCaseItem]
  'edit-ai': [useCase: UseCaseItem]
}>()
</script>

<template>
  <ListBox
    title="Use Cases"
    class="mb-4"
    empty-text="No use cases yet. Click + to add one."
    @add="$emit('add')"
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
                @dblclick.stop="$emit('edit', useCase)"
              >{{ useCase.name }}</span>
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-pencil"
                title="Edit"
                @click="$emit('edit', useCase)"
              />
              <v-list-item
                prepend-icon="mdi-robot"
                title="Edit with AI"
                @click="$emit('edit-ai', useCase)"
              />
              <v-list-item
                prepend-icon="mdi-delete"
                title="Delete"
                @click="$emit('delete', useCase)"
              />
            </v-list>
          </v-menu>
        </v-card-title>
        <v-card-text>{{ useCase.description }}</v-card-text>
      </v-card>
    </template>
  </ListBox>
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
