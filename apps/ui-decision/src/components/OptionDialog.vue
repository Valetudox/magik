<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  editOption?: { id: string; name: string; description: string; moreLink?: string } | null
}>()

const emit = defineEmits<{
  save: [option: { name: string; description: string; moreLink?: string }]
}>()

const modelValue = defineModel<boolean>()

const form = ref<any>(null)
const name = ref('')
const description = ref('')
const moreLink = ref('')

const isEditMode = computed(() => !!props.editOption)
const dialogTitle = computed(() => (isEditMode.value ? 'Edit Option' : 'Add Option'))
const saveButtonText = computed(() => (isEditMode.value ? 'Save' : 'Add'))

const rules = {
  required: (v: string) => !!v?.trim() || 'Required',
  maxLength200: (v: string) => !v || v.length <= 200 || 'Max 200 characters',
  url: (v: string) => {
    if (!v) return true
    try {
      new URL(v)
      return true
    } catch {
      return 'Must be a valid URL'
    }
  },
}

watch(modelValue, (open) => {
  if (open) {
    if (props.editOption) {
      name.value = props.editOption.name
      description.value = props.editOption.description
      moreLink.value = props.editOption.moreLink || ''
    } else {
      name.value = ''
      description.value = ''
      moreLink.value = ''
    }
  }
})

const handleSave = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  const optionData: { name: string; description: string; moreLink?: string } = {
    name: name.value.trim(),
    description: description.value.trim(),
  }

  if (moreLink.value.trim()) {
    optionData.moreLink = moreLink.value.trim()
  }

  emit('save', optionData)
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
            :rules="[rules.required, rules.maxLength200]"
            variant="outlined"
            rows="3"
            counter="200"
            class="mb-4"
          />
          <v-text-field
            v-model="moreLink"
            label="More Info Link (optional)"
            :rules="[rules.url]"
            variant="outlined"
            placeholder="https://..."
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel"> Cancel </v-btn>
        <v-btn color="primary" variant="flat" @click="handleSave">
          {{ saveButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
