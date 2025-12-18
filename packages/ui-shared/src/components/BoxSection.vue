<script setup lang="ts">
import Editable from './Editable.vue'

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
</script>

<template>
  <Editable
    :editable="props.editable"
    @edit="$emit('edit')"
    @edit-ai="$emit('editAi')"
  >
    <div class="box-section">
      <p v-if="props.title" class="font-weight-bold mb-2">{{ props.title }}</p>
      <slot />
    </div>
  </Editable>
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
</style>
