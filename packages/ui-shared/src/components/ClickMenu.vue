<script setup lang="ts">
import { ref, useSlots, cloneVNode, type VNode } from 'vue'

export interface ClickMenuItem {
  key: string
  title: string
  icon?: string
  class?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    items: ClickMenuItem[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  }
)

const emit = defineEmits<{
  select: [key: string]
}>()

const slots = useSlots()
const menuOpen = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const onDblclick = (event: MouseEvent) => {
  if (props.disabled) return
  event.stopPropagation()
  menuPosition.value = { x: event.clientX, y: event.clientY }
  menuOpen.value = true
}

const handleSelect = (key: string) => {
  emit('select', key)
  menuOpen.value = false
}

const renderSlot = (): VNode | null => {
  const children = slots.default?.()
  if (!children || children.length === 0) return null

  const child = children[0]
  if (!child) return null

  return cloneVNode(child, props.disabled ? {} : { onDblclick })
}
</script>

<template>
  <component :is="renderSlot" />

  <v-menu
    v-if="!props.disabled"
    v-model="menuOpen"
    :target="[menuPosition.x, menuPosition.y]"
    location="end"
  >
    <v-list density="compact">
      <v-list-item
        v-for="item in props.items"
        :key="item.key"
        :prepend-icon="item.icon"
        :title="item.title"
        :class="item.class"
        :disabled="item.disabled"
        @click="handleSelect(item.key)"
      />
    </v-list>
  </v-menu>
</template>
