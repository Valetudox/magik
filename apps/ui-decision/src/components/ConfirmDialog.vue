<script setup lang="ts">
const props = defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
}>()

const emit = defineEmits<{
  confirm: []
}>()

const modelValue = defineModel<boolean>()

const handleConfirm = () => {
  emit('confirm')
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
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ cancelText || 'Cancel' }}
        </v-btn>
        <v-btn :color="confirmColor || 'error'" variant="flat" @click="handleConfirm">
          {{ confirmText || 'Confirm' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
