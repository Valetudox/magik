<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  entityName: string
  target: { id: string; item: any } | null
  selectedCount: number
  deleting: boolean
  confirmMessage?: (item: any) => string
  bulkConfirmMessage?: (count: number) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const message = computed(() => {
  if (props.target) {
    // Single delete
    if (props.confirmMessage) {
      return props.confirmMessage(props.target.item)
    }
    const name = props.target.item.name || props.target.item.title || props.target.id
    return `Are you sure you want to delete "${name}"?`
  } else {
    // Bulk delete
    if (props.bulkConfirmMessage) {
      return props.bulkConfirmMessage(props.selectedCount)
    }
    return `Are you sure you want to delete ${props.selectedCount} ${props.selectedCount === 1 ? props.entityName : props.entityName + 's'}?`
  }
})

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <v-dialog
    v-model="show"
    max-width="500"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6">
        Confirm Deletion
      </v-card-title>

      <v-card-text>
        <div class="d-flex align-center mb-4">
          <v-icon color="error" size="48" class="mr-4">
            mdi-alert-circle-outline
          </v-icon>
          <div>{{ message }}</div>
        </div>
        <p class="text-body-2 text-grey">
          This action cannot be undone.
        </p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="deleting"
          @click="show = false"
        >
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="deleting"
          @click="handleConfirm"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
