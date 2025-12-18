<script setup lang="ts">
import { ref, useSlots, cloneVNode, type VNode } from 'vue'

const props = withDefaults(
  defineProps<{
    editable?: boolean
  }>(),
  {
    editable: true,
  }
)

const emit = defineEmits<{
  edit: []
  editAi: []
}>()

const slots = useSlots()
const menuOpen = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const onDblclick = (event: MouseEvent) => {
  if (!props.editable) return
  event.stopPropagation()
  menuPosition.value = { x: event.clientX, y: event.clientY }
  menuOpen.value = true
}

const renderSlot = (): VNode | null => {
  const children = slots.default?.()
  if (!children || children.length === 0) return null

  const child = children[0]
  if (!child) return null

  // Clone the VNode and inject the dblclick handler
  return cloneVNode(child, props.editable ? { onDblclick } : {})
}
</script>

<template>
  <component :is="renderSlot" />

  <v-menu
    v-if="props.editable"
    v-model="menuOpen"
    :target="[menuPosition.x, menuPosition.y]"
    location="end"
  >
    <v-list density="compact">
      <v-list-item
        prepend-icon="mdi-pencil"
        title="Edit"
        @click="emit('edit')"
      />
      <v-list-item
        prepend-icon="mdi-robot"
        title="Edit with AI"
        @click="emit('editAi')"
      />
    </v-list>
  </v-menu>
</template>
