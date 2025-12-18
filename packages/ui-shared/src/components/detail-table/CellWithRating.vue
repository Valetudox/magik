<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RatingDecoratorInput, RatingLevel } from '../../types/detail-table.schema'
import RatingDialog from '../RatingDialog.vue'

const props = defineProps<{
  rating: RatingDecoratorInput
  ratingValue: string | null | undefined
  editable?: boolean
  subtitle?: string
}>()

const emit = defineEmits<{
  'update:rating': [value: string | null]
}>()

const dialogOpen = ref(false)

// Find the current rating level config
const currentLevel = computed((): RatingLevel | null => {
  if (!props.ratingValue) return null
  return props.rating.levels.find((l) => l.key === props.ratingValue) ?? null
})

// Check if color is a Vuetify theme color
const isThemeColor = (color: string) => {
  return ['primary', 'secondary', 'success', 'warning', 'error', 'info'].includes(color)
}

// Get background color style for indicator
const indicatorStyle = computed(() => {
  if (!currentLevel.value) return { backgroundColor: 'transparent' }
  const color = currentLevel.value.color
  if (isThemeColor(color)) {
    return { backgroundColor: `rgb(var(--v-theme-${color}))` }
  }
  return { backgroundColor: color }
})

const handleClick = () => {
  if (props.editable) {
    dialogOpen.value = true
  }
}

const handleSave = (newValue: string | null) => {
  emit('update:rating', newValue)
}
</script>

<template>
  <div class="cell-with-rating">
    <div
      class="rating-bar"
      :class="{ 'rating-bar--editable': editable, 'rating-bar--empty': !currentLevel }"
      :style="indicatorStyle"
      @click="handleClick"
    />
    <div class="cell-content">
      <slot />
    </div>
  </div>

  <RatingDialog
    v-model="dialogOpen"
    title="Change Rating"
    :subtitle="subtitle"
    :current-rating="ratingValue ?? null"
    :config="rating"
    @save="handleSave"
  />
</template>

<style scoped>
.cell-with-rating {
  display: flex;
  min-height: 60px;
}

.rating-bar {
  width: 12px;
  min-width: 12px;
  transition: width 0.15s ease;
}

.rating-bar--editable {
  cursor: pointer;
}

.rating-bar--editable:hover {
  width: 20px;
}

.rating-bar--empty {
  background-color: rgba(128, 128, 128, 0.2);
}

.cell-content {
  flex: 1;
  min-width: 0;
  padding: 8px;
}
</style>
