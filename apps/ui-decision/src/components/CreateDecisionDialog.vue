<script setup lang="ts">
import { ref, watch } from 'vue'
import { api } from '../services/api'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [result: { id: string; [key: string]: unknown }]
}>()

const newDecisionName = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)

// Reset state when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    newDecisionName.value = ''
    createError.value = null
  }
})

const handleCreate = async () => {
  if (!newDecisionName.value.trim()) {
    createError.value = 'Please enter a name'
    return
  }

  creating.value = true
  createError.value = null

  try {
    const result = await api.createDecision(newDecisionName.value.trim())
    emit('update:modelValue', false)
    emit('created', result)
  } catch (err: unknown) {
    createError.value = (err as Error).message ?? 'Failed to create decision'
  } finally {
    creating.value = false
  }
}

const handleClose = () => {
  if (!creating.value) {
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>Create New Decision</v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleCreate">
          <v-text-field
            v-model="newDecisionName"
            label="Decision Name"
            :error-messages="createError || undefined"
            hint="Will be converted to a filename (lowercase, hyphens)"
            persistent-hint
            autofocus
            :disabled="creating"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="creating"
          @click="handleClose"
        >
          Cancel
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          :loading="creating"
          @click="handleCreate"
        >
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
