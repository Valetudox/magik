<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title?: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
})

defineEmits<{
  edit: []
  editAi: []
}>()

const menuOpen = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const handleDoubleClick = (event: MouseEvent) => {
  if (!props.editable) return
  menuPosition.value = { x: event.clientX, y: event.clientY }
  menuOpen.value = true
}
</script>

<template>
  <div
    class="box-section"
    :class="{ 'editable-section': props.editable }"
    @dblclick="handleDoubleClick"
  >
    <p v-if="props.title" class="font-weight-bold mb-2">{{ props.title }}</p>
    <slot />

    <v-menu
      v-model="menuOpen"
      :target="[menuPosition.x, menuPosition.y]"
      location="end"
    >
      <v-list density="compact">
        <v-list-item
          prepend-icon="mdi-pencil"
          title="Edit"
          @click="$emit('edit')"
        />
        <v-list-item
          prepend-icon="mdi-robot"
          title="Edit with AI"
          @click="$emit('editAi')"
        />
      </v-list>
    </v-menu>
  </div>
</template>

<style scoped>
.editable-section {
  cursor: pointer;
  border-radius: 4px;
  padding: 4px;
  margin: -4px;
}

.editable-section:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>
