<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  optionName: string
  driverName: string
  details: string[]
}>()

const emit = defineEmits<{
  save: [details: string[]]
}>()

const modelValue = defineModel<boolean>()

const form = ref<any>(null)
const editedDetails = ref('')

const rules = {
  required: (v: string) => !!v?.trim() || 'Required',
}

watch(modelValue, (open) => {
  if (open) {
    // Join array into multiline text (one detail per line)
    editedDetails.value = props.details.join('\n')
  }
})

const handleSave = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  // Split by newlines and filter empty lines
  const details = editedDetails.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  emit('save', details)
  modelValue.value = false
}

const handleCancel = () => {
  modelValue.value = false
}
</script>

<template>
  <v-dialog v-model="modelValue" max-width="1200">
    <v-card>
      <v-card-title>Edit Evaluation</v-card-title>
      <v-card-subtitle>{{ optionName }} - {{ driverName }}</v-card-subtitle>
      <v-card-text>
        <v-form ref="form">
          <v-textarea
            v-model="editedDetails"
            label="Evaluation details (one per line)"
            :rules="[rules.required]"
            variant="outlined"
            rows="12"
            auto-grow
            hint="Each line becomes a bullet point"
            persistent-hint
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel"> Cancel </v-btn>
        <v-btn color="primary" variant="flat" @click="handleSave"> Save </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
