<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    items: string[]
    label?: string
    hint?: string
    rows?: number
    maxWidth?: number
    required?: boolean
  }>(),
  {
    subtitle: '',
    label: 'Items (one per line)',
    hint: 'Each line becomes a list item',
    rows: 8,
    maxWidth: 800,
    required: true,
  }
)

const emit = defineEmits<{
  save: [items: string[]]
}>()

const modelValue = defineModel<boolean>()

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const editedText = ref('')

const rules = {
  required: (v: string) => !!v?.trim() || 'Required',
}

const validationRules = computed(() => (props.required ? [rules.required] : []))

watch(modelValue, (open) => {
  if (open) {
    editedText.value = props.items.join('\n')
  }
})

const handleSave = async () => {
  if (form.value) {
    const { valid } = await form.value.validate()
    if (!valid) return
  }

  const items = editedText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  emit('save', items)
  modelValue.value = false
}

const handleCancel = () => {
  modelValue.value = false
}
</script>

<template>
  <v-dialog v-model="modelValue" :max-width="props.maxWidth">
    <v-card>
      <v-card-title>{{ props.title }}</v-card-title>
      <v-card-subtitle v-if="props.subtitle">{{ props.subtitle }}</v-card-subtitle>
      <v-card-text>
        <v-form ref="form">
          <v-textarea
            v-model="editedText"
            :label="props.label"
            :rules="validationRules"
            variant="outlined"
            :rows="props.rows"
            auto-grow
            :hint="props.hint"
            persistent-hint
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
