<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { RatingDecoratorInput } from '../types/detail-table.schema'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    currentRating: string | null
    config: RatingDecoratorInput
  }>(),
  {
    title: 'Select Rating',
  }
)

const emit = defineEmits<{
  save: [rating: string | null]
}>()

const modelValue = defineModel<boolean>()

const selectedRating = ref<string | null>(props.currentRating)

watch(modelValue, (open) => {
  if (open) {
    selectedRating.value = props.currentRating
  }
})

// Build options from config, optionally including "empty" option
const ratingOptions = computed(() => {
  const options = props.config.levels.map((level) => ({
    value: level.key,
    label: level.label,
    color: level.color,
    icon: level.icon,
  }))

  if (props.config.allowEmpty) {
    options.unshift({
      value: '',
      label: props.config.emptyLabel ?? 'Not rated',
      color: 'grey',
      icon: undefined,
    })
  }

  return options
})

// Check if color is a Vuetify theme color or CSS color
const isThemeColor = (color: string) => {
  return ['primary', 'secondary', 'success', 'warning', 'error', 'info'].includes(color)
}

const handleSave = () => {
  emit('save', selectedRating.value || null)
  modelValue.value = false
}

const handleCancel = () => {
  modelValue.value = false
}
</script>

<template>
  <v-dialog v-model="modelValue" max-width="400">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-subtitle v-if="subtitle" class="pb-0">
        {{ subtitle }}
      </v-card-subtitle>
      <v-card-text>
        <v-radio-group v-model="selectedRating" class="rating-options">
          <v-radio
            v-for="option in ratingOptions"
            :key="option.value"
            :value="option.value"
            :color="isThemeColor(option.color) ? option.color : undefined"
          >
            <template #label>
              <div class="rating-option">
                <v-chip
                  :color="isThemeColor(option.color) ? option.color : undefined"
                  :style="!isThemeColor(option.color) ? { backgroundColor: option.color } : undefined"
                  size="small"
                  variant="flat"
                  class="mr-2"
                >
                  <v-icon v-if="option.icon" :icon="option.icon" size="small" class="mr-1" />
                  {{ option.label }}
                </v-chip>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="handleSave">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.rating-options {
  margin-top: 8px;
}

.rating-option {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
