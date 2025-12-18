<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueMermaidRender } from 'vue-mermaid-render'

// Mermaid configuration - white nodes, black borders
const mermaidConfig = {
  theme: 'base' as const,
  themeVariables: {
    primaryColor: '#ffffff',
    primaryTextColor: '#000000',
    primaryBorderColor: '#000000',
    secondaryColor: '#ffffff',
    secondaryTextColor: '#000000',
    secondaryBorderColor: '#000000',
    tertiaryColor: '#ffffff',
    tertiaryTextColor: '#000000',
    tertiaryBorderColor: '#000000',
    lineColor: '#000000',
    nodeBkg: '#ffffff',
    nodeBorder: '#000000',
    mainBkg: '#ffffff',
  },
}

const props = withDefaults(
  defineProps<{
    title: string
    value?: string
  }>(),
  {
    value: '',
  }
)

const emit = defineEmits<{
  save: [value: string]
}>()

const modelValue = defineModel<boolean>()

const editedValue = ref('')

watch(modelValue, (open) => {
  if (open) {
    editedValue.value = props.value
  }
})

const handleSave = () => {
  emit('save', editedValue.value.trim())
  modelValue.value = false
}

const handleCancel = () => {
  modelValue.value = false
}
</script>

<template>
  <v-dialog v-model="modelValue" width="90vw" height="90vh">
    <v-card class="dialog-card">
      <v-card-title>{{ props.title }}</v-card-title>
      <v-card-text class="dialog-content">
        <div class="editor-container">
          <div class="editor-pane">
            <div class="pane-header">Mermaid Code</div>
            <v-textarea
              v-model="editedValue"
              variant="outlined"
              hide-details
              class="code-textarea"
              placeholder="Enter mermaid diagram code..."
            />
          </div>
          <div class="preview-pane">
            <div class="pane-header">Preview</div>
            <div class="preview-container">
              <VueMermaidRender
                v-if="editedValue.trim()"
                :content="editedValue"
                :config="mermaidConfig"
              />
              <span v-else class="text-grey">Enter mermaid code to see preview</span>
            </div>
          </div>
        </div>
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

<style scoped>
.dialog-card {
  display: flex;
  flex-direction: column;
  height: 90vh;
}

.dialog-content {
  flex: 1;
  overflow: hidden;
  padding: 16px !important;
}

.editor-container {
  display: flex;
  gap: 16px;
  height: 100%;
}

.editor-pane,
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pane-header {
  font-weight: 500;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.6);
}

.code-textarea {
  flex: 1;
}

.code-textarea :deep(.v-input__control) {
  height: 100%;
}

.code-textarea :deep(.v-field) {
  height: 100%;
}

.code-textarea :deep(.v-field__field) {
  height: 100%;
}

.code-textarea :deep(textarea) {
  height: 100% !important;
  font-family: monospace;
  font-size: 14px;
}

.preview-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.preview-container :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
