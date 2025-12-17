<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, watch } from 'vue'
import type { BulkOperationConfig, BulkOperationResult } from '../types/list-page.types'

interface Props {
  modelValue: boolean
  selectedItems: T[]
  config: BulkOperationConfig<T>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'complete': []
}>()

const operating = ref(false)
const progress = ref(0)
const showResults = ref(false)
const results = ref<{
  total: number
  successful: number
  failed: number
  results: BulkOperationResult[]
}>({
  total: 0,
  successful: 0,
  failed: 0,
  results: [],
})

// Start operation when dialog opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.selectedItems.length > 0) {
    await startOperation()
  }
})

const startOperation = async () => {
  operating.value = true
  progress.value = 0

  const operationResults: BulkOperationResult[] = []

  for (let i = 0; i < props.selectedItems.length; i++) {
    const item = props.selectedItems[i]
    if (!item) continue

    try {
      const result = await props.config.operation(item)
      operationResults.push(result)
    } catch (error: unknown) {
      // If operation throws, create a failed result
      operationResults.push({
        success: false,
        id: (item as any).id || String(i),
        name: (item as any).name || (item as any).title || 'Unknown',
        error: (error as Error).message ?? 'Unknown error',
      })
    }

    progress.value = Math.round(((i + 1) / props.selectedItems.length) * 100)
  }

  // Update results
  results.value = {
    total: props.selectedItems.length,
    successful: operationResults.filter((r) => r.success).length,
    failed: operationResults.filter((r) => !r.success).length,
    results: operationResults,
  }

  operating.value = false
  emit('update:modelValue', false)
  showResults.value = true
  emit('complete')
}

const closeResults = () => {
  showResults.value = false
}
</script>

<template>
  <!-- Progress dialog -->
  <v-dialog
    :model-value="modelValue"
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
          {{ config.title }}
        </p>
        <p class="text-body-2 text-grey">
          Please wait...
        </p>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Results dialog -->
  <v-dialog
    v-model="showResults"
    max-width="600"
  >
    <v-card>
      <v-card-title>{{ config.resultsTitle }}</v-card-title>

      <v-card-text>
        <v-alert
          :type="results.failed === 0 ? 'success' : 'warning'"
          variant="tonal"
          class="mb-4"
        >
          Successfully completed {{ results.successful }} of {{ results.total }} operations.
          <span v-if="results.failed > 0">{{ results.failed }} failed.</span>
        </v-alert>

        <v-list>
          <v-list-item
            v-for="result in results.results"
            :key="result.id"
          >
            <template #prepend>
              <v-icon :color="result.success ? 'success' : 'error'">
                {{ result.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
            </template>
            <v-list-item-title>{{ result.name }}</v-list-item-title>
            <v-list-item-subtitle v-if="!result.success">
              {{ result.error }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="closeResults"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
