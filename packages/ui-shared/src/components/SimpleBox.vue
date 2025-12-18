<script setup lang="ts">
interface Props {
  title: string
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
  <v-card>
    <v-card-title>{{ props.title }}</v-card-title>
    <v-card-text
      :class="{ 'editable-content': props.editable }"
      @dblclick="props.editable && $emit('edit')"
    >
      <slot />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.editable-content {
  cursor: pointer;
}

.editable-content:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>
