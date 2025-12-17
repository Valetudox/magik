<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  progress: number
  operationName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <v-dialog
    v-model="show"
    persistent
    max-width="400"
  >
    <v-card>
      <v-card-text class="text-center py-8">
        <v-progress-circular
          :model-value="progress"
          :size="80"
          :width="8"
          color="primary"
          class="mb-4"
        >
          {{ progress }}%
        </v-progress-circular>
        <p class="text-h6 mb-2">
          {{ operationName }}
        </p>
        <p class="text-body-2 text-grey">
          Please wait...
        </p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
