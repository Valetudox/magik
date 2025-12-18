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
  <v-card class="simple-box">
    <v-card-title class="d-flex align-center">
      <slot name="header">{{ props.title }}</slot>
      <v-spacer />
      <v-btn
        v-if="props.editable"
        icon="mdi-pencil"
        size="small"
        variant="text"
        class="hover-btn"
        @click="$emit('edit')"
      />
    </v-card-title>
    <v-card-text>
      <slot />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.simple-box .hover-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.simple-box:hover .hover-btn {
  opacity: 1;
}
</style>
