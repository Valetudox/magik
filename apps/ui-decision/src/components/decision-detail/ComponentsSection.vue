<script setup lang="ts">
import { ListBox } from '@magik/ui-shared'

export interface ComponentItem {
  id: string
  name: string
  description: string
}

defineProps<{
  components: ComponentItem[]
}>()

defineEmits<{
  add: []
  edit: [component: ComponentItem]
  delete: [component: ComponentItem]
  'edit-ai': [component: ComponentItem]
}>()
</script>

<template>
  <ListBox
    title="Components"
    class="mb-4"
    empty-text="No components yet. Click + to add one."
    @add="$emit('add')"
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
                @dblclick.stop="$emit('edit', component)"
              >{{ component.name }}</span>
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-pencil"
                title="Edit"
                @click="$emit('edit', component)"
              />
              <v-list-item
                prepend-icon="mdi-robot"
                title="Edit with AI"
                @click="$emit('edit-ai', component)"
              />
              <v-list-item
                prepend-icon="mdi-delete"
                title="Delete"
                @click="$emit('delete', component)"
              />
            </v-list>
          </v-menu>
        </v-card-title>
        <v-card-text>{{ component.description }}</v-card-text>
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
