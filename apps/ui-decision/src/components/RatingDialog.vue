<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  optionName: string
  driverName: string
  currentRating: 'high' | 'medium' | 'low'
}>()

const emit = defineEmits<{
  save: [rating: 'high' | 'medium' | 'low']
}>()

const modelValue = defineModel<boolean>()

const selectedRating = ref<'high' | 'medium' | 'low'>(props.currentRating)

watch(modelValue, (open) => {
  if (open) {
    selectedRating.value = props.currentRating
  }
})

const ratingOptions = [
  {
    value: 'high',
    title: 'High',
    color: 'success',
    description: 'Meets requirements well / Good fit / Low risk',
  },
  {
    value: 'medium',
    title: 'Medium',
    color: 'warning',
    description: 'Partially meets requirements / Acceptable with trade-offs / Medium risk',
  },
  {
    value: 'low',
    title: 'Low',
    color: 'error',
    description: 'Does not meet requirements / Significant concerns / High risk',
  },
] as const

const handleSave = () => {
  emit('save', selectedRating.value)
  modelValue.value = false
}

const handleCancel = () => {
  modelValue.value = false
}
</script>

<template>
  <v-dialog v-model="modelValue" max-width="400">
    <v-card>
      <v-card-title>Change Rating</v-card-title>
      <v-card-subtitle class="pb-0">
        {{ optionName }} / {{ driverName }}
      </v-card-subtitle>
      <v-card-text>
        <v-radio-group v-model="selectedRating" class="rating-options">
          <v-radio
            v-for="option in ratingOptions"
            :key="option.value"
            :value="option.value"
            :color="option.color"
          >
            <template #label>
              <div class="rating-option">
                <v-chip
                  :color="option.color"
                  size="small"
                  variant="flat"
                  class="mr-2"
                >
                  {{ option.title }}
                </v-chip>
                <span class="rating-description">{{ option.description }}</span>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="flat" @click="handleSave">
          Save
        </v-btn>
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

.rating-description {
  font-size: 0.85em;
  color: rgba(255, 255, 255, 0.7);
}
</style>
