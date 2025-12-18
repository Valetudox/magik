<script setup lang="ts">
interface Props {
  title?: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
})

defineEmits<{
  edit: []
}>()
</script>

<template>
  <div class="box-section">
    <div v-if="props.title" class="d-flex align-center mb-2">
      <span class="font-weight-bold">{{ props.title }}</span>
      <v-spacer />
      <v-btn
        v-if="props.editable"
        icon="mdi-pencil"
        size="x-small"
        variant="text"
        class="hover-btn"
        @click="$emit('edit')"
      />
    </div>
    <div v-else-if="props.editable" class="d-flex">
      <div class="flex-grow-1">
        <slot />
      </div>
      <v-btn
        icon="mdi-pencil"
        size="x-small"
        variant="text"
        class="hover-btn ml-2"
        @click="$emit('edit')"
      />
    </div>
    <div v-if="props.title">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.box-section .hover-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.box-section:hover .hover-btn {
  opacity: 1;
}
</style>
