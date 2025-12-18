<script setup lang="ts">
interface Props {
  title: string
  emptyText?: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  emptyText: 'No items yet. Click + to add one.',
  editable: true,
})

defineEmits<{
  add: []
}>()
</script>

<template>
  <v-card class="list-box">
    <v-card-title class="d-flex align-center">
      <span>{{ props.title }}</span>
      <v-spacer />
      <v-btn
        v-if="props.editable"
        icon="mdi-plus"
        size="small"
        variant="text"
        class="hover-btn"
        @click="$emit('add')"
      />
    </v-card-title>
    <v-card-text>
      <slot>
        <div class="text-center text-grey py-4">
          {{ props.emptyText }}
        </div>
      </slot>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.list-box .hover-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.list-box:hover .hover-btn {
  opacity: 1;
}
</style>
