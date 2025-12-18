<script setup lang="ts">
import { ref } from 'vue'
import Editable from './Editable.vue'
import TextEditDialog from './TextEditDialog.vue'

interface Props {
  title: string
  value?: string
  editable?: boolean
  multiline?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  editable: true,
  multiline: true,
  emptyText: 'Double-click to add content...',
})

const emit = defineEmits<{
  update: [value: string]
  'edit-ai': []
}>()

const dialogOpen = ref(false)

const handleEdit = () => {
  dialogOpen.value = true
}

const handleSave = (newValue: string) => {
  emit('update', newValue)
}
</script>

<template>
  <div class="simple-box">
    <v-card>
      <v-card-title>{{ props.title }}</v-card-title>
      <Editable
        :editable="props.editable"
        @edit="handleEdit"
        @edit-ai="$emit('edit-ai')"
      >
        <div class="v-card-text">
          <slot>
            <span :class="{ 'empty-placeholder': !value }">
              {{ value || emptyText }}
            </span>
          </slot>
        </div>
      </Editable>
    </v-card>

    <TextEditDialog
      v-model="dialogOpen"
      :title="`Edit ${title}`"
      :value="value ?? ''"
      :multiline="multiline"
      @save="handleSave"
    />
  </div>
</template>

<style scoped>
.empty-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}
</style>
