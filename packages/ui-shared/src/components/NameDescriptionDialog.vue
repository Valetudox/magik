<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface EditItem {
  id: string
  name: string
  description: string
}

const props = withDefaults(
  defineProps<{
    entityName: string
    editItem?: EditItem | null
    descriptionMaxLength?: number
    descriptionRows?: number
  }>(),
  {
    editItem: null,
    descriptionMaxLength: 0,
    descriptionRows: 4,
  }
)

const emit = defineEmits<{
  save: [data: { name: string; description: string }]
}>()

const modelValue = defineModel<boolean>()

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const name = ref('')
const description = ref('')

const isEditMode = computed(() => !!props.editItem)
const dialogTitle = computed(() =>
  isEditMode.value ? `Edit ${props.entityName}` : `Add ${props.entityName}`
)
const saveButtonText = computed(() => (isEditMode.value ? 'Save' : 'Add'))

const rules = {
  required: (v: string) => !!v?.trim() || 'Required',
  maxLength: (max: number) => (v: string) =>
    !v || v.length <= max || `Max ${max} characters`,
}

const descriptionRules = computed(() => {
  const r: Array<(v: string) => boolean | string> = [rules.required]
  if (props.descriptionMaxLength > 0) {
    r.push(rules.maxLength(props.descriptionMaxLength))
  }
  return r
})

watch(modelValue, (open) => {
  if (open) {
    if (props.editItem) {
      name.value = props.editItem.name
      description.value = props.editItem.description
    } else {
      name.value = ''
      description.value = ''
    }
  }
})

const handleSave = async () => {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  emit('save', {
    name: name.value.trim(),
    description: description.value.trim(),
  })
  modelValue.value = false
}

const handleCancel = () => {
  modelValue.value = false
}
</script>

<template>
  <v-dialog v-model="modelValue" max-width="500">
    <v-card>
      <v-card-title>{{ dialogTitle }}</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="name"
            label="Name"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
          />
          <v-textarea
            v-model="description"
            label="Description"
            :rules="descriptionRules"
            variant="outlined"
            :rows="props.descriptionRows"
            :counter="props.descriptionMaxLength > 0 ? props.descriptionMaxLength : undefined"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="flat" @click="handleSave">
          {{ saveButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
