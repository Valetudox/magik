<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    label?: string
    value?: string
    multiline?: boolean
    rows?: number
    placeholder?: string
    hint?: string
    required?: boolean
  }>(),
  {
    label: '',
    value: '',
    multiline: true,
    rows: 6,
    placeholder: '',
    hint: '',
    required: true,
  }
)

const emit = defineEmits<{
  save: [value: string]
}>()

const modelValue = defineModel<boolean>()

const editedValue = ref('')

const rules = {
  required: (v: string) => !!v?.trim() || 'Required',
}

watch(modelValue, (open) => {
  if (open) {
    editedValue.value = props.value
  }
})

const handleSave = () => {
  if (props.required && !editedValue.value.trim()) return
  emit('save', editedValue.value.trim())
  modelValue.value = false
}

const handleCancel = () => {
  modelValue.value = false
}
</script>

<template>
  <v-dialog v-model="modelValue" max-width="600">
    <v-card>
      <v-card-title>{{ props.title }}</v-card-title>
      <v-card-text>
        <v-textarea
          v-if="props.multiline"
          v-model="editedValue"
          :label="props.label"
          :rules="props.required ? [rules.required] : []"
          :placeholder="props.placeholder"
          :hint="props.hint"
          :persistent-hint="!!props.hint"
          variant="outlined"
          :rows="props.rows"
          auto-grow
        />
        <v-text-field
          v-else
          v-model="editedValue"
          :label="props.label"
          :rules="props.required ? [rules.required] : []"
          :placeholder="props.placeholder"
          :hint="props.hint"
          :persistent-hint="!!props.hint"
          variant="outlined"
        />
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
