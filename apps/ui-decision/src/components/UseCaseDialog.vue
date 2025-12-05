<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  editUseCase?: { id: string; name: string; description: string } | null
}>()

const emit = defineEmits<{
  save: [useCase: { name: string; description: string }]
}>()

const modelValue = defineModel<boolean>()

const form = ref<any>(null)
const name = ref('')
const description = ref('')

const isEditMode = computed(() => !!props.editUseCase)
const dialogTitle = computed(() => (isEditMode.value ? 'Edit Use Case' : 'Add Use Case'))
const saveButtonText = computed(() => (isEditMode.value ? 'Save' : 'Add'))

const rules = {
  required: (v: string) => !!v?.trim() || 'Required',
}

watch(modelValue, (open) => {
  if (open) {
    if (props.editUseCase) {
      name.value = props.editUseCase.name
      description.value = props.editUseCase.description
    } else {
      name.value = ''
      description.value = ''
    }
  }
})

const handleSave = async () => {
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
            :rules="[rules.required]"
            variant="outlined"
            rows="4"
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
