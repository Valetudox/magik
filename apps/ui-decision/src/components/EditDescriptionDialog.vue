<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  optionName: string
  description: string
}>()

const emit = defineEmits<{
  save: [description: string]
}>()

const modelValue = defineModel<boolean>()

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const editedDescription = ref('')

const rules = {
  required: (v: string) => !!v?.trim() || 'Required',
  maxLength200: (v: string) => !v || v.length <= 200 || 'Max 200 characters',
}

watch(modelValue, (open) => {
  if (open) {
    editedDescription.value = props.description
  }
})

const handleSave = async () => {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  emit('save', editedDescription.value.trim())
  modelValue.value = false
}

const handleCancel = () => {
  modelValue.value = false
}
</script>

<template>
  <v-dialog v-model="modelValue" max-width="500">
    <v-card>
      <v-card-title>Edit Description - {{ optionName }}</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-textarea
            v-model="editedDescription"
            label="Description"
            :rules="[rules.required, rules.maxLength200]"
            variant="outlined"
            rows="4"
            counter="200"
            auto-grow
          />
        </v-form>
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
