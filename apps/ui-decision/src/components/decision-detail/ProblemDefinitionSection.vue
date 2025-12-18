<script setup lang="ts">
import { SimpleBox } from '@magik/ui-shared'

defineProps<{
  value?: string
}>()

defineEmits<{
  update: [value: string]
  'edit-ai': []
}>()
</script>

<template>
  <SimpleBox
    title="Problem Definition"
    class="mb-4"
    :value="value"
    empty-text="Double-click to add problem definition..."
    @update="$emit('update', $event)"
    @edit-ai="$emit('edit-ai')"
  />
</template>
