<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, type TableDocumentDetail, type TableRow } from '../services/api'
import { VueMermaidRender } from 'vue-mermaid-render'
import { initSocket, onTableDocumentUpdated } from '../services/socket'

const route = useRoute()
const router = useRouter()
const document = ref<TableDocumentDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const showNotification = ref(false)
const pushingToConfluence = ref(false)
const pushNotification = ref<{ show: boolean; message: string; type: 'success' | 'error' }>({
  show: false,
  message: '',
  type: 'success',
})
const agentPrompt = ref('')
const agentProcessing = ref(false)
const agentNotification = ref<{ show: boolean; message: string; type: 'success' | 'error' }>({
  show: false,
  message: '',
  type: 'success',
})

// Use case dialog state
const showUseCaseDialog = ref(false)
const editingUseCase = ref<TableRow | null>(null)
const useCaseForm = ref<Omit<TableRow, 'id'>>({
  use_case: '',
  diagram: '',
  required_context: [],
  required_tools: [],
  potential_interactions: [],
  notes: [],
})

// Field-specific edit dialogs
const showEditFieldDialog = ref(false)
const editFieldData = ref<{
  useCaseId: string
  fieldName: string
  fieldLabel: string
  fieldType: 'text' | 'textarea' | 'array'
  value: string | string[]
} | null>(null)

// Confluence URL editor
const showEditConfluenceUrlDialog = ref(false)
const confluenceUrlInput = ref('')

// Delete confirmation
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; use_case: string } | null>(null)

// Setup Socket.IO listeners
let unsubscribeUpdate: (() => void) | null = null

onMounted(() => {
  const id = route.params.id as string
  loading.value = true

  // Initialize Socket.IO
  initSocket()

  // Listen for document updates
  unsubscribeUpdate = onTableDocumentUpdated(({ id: updatedId, document: updatedDocument }) => {
    const currentId = route.params.id as string
    if (updatedId === currentId) {
      document.value = updatedDocument
      showNotification.value = true
    }
  })

  // Load document data
  void (async () => {
    try {
      document.value = await api.getTableDocument(id)
      confluenceUrlInput.value = document.value.confluence_url || ''
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) {
        error.value = 'Table document not found'
      } else {
        error.value = 'Failed to load table document. Make sure the backend is running on http://localhost:4004'
      }
      console.error(e)
    } finally {
      loading.value = false
    }
  })()
})

// Cleanup on unmount
onUnmounted(() => {
  if (unsubscribeUpdate) {
    unsubscribeUpdate()
  }
})

const goBack = () => {
  void router.push('/')
}

const openAddUseCaseDialog = () => {
  editingUseCase.value = null
  useCaseForm.value = {
    use_case: '',
    diagram: '',
    required_context: [],
    required_tools: [],
    potential_interactions: [],
    notes: [],
  }
  showUseCaseDialog.value = true
}

const openEditUseCaseDialog = (useCase: TableRow) => {
  editingUseCase.value = useCase
  useCaseForm.value = {
    use_case: useCase.use_case,
    diagram: useCase.diagram || '',
    required_context: useCase.required_context || [],
    required_tools: useCase.required_tools || [],
    potential_interactions: useCase.potential_interactions || [],
    notes: useCase.notes || [],
  }
  showUseCaseDialog.value = true
}

const closeUseCaseDialog = () => {
  showUseCaseDialog.value = false
  editingUseCase.value = null
}

const saveUseCase = async () => {
  if (!document.value) return

  try {
    const cleanForm = {
      use_case: useCaseForm.value.use_case,
      diagram: useCaseForm.value.diagram || undefined,
      required_context: useCaseForm.value.required_context?.length ? useCaseForm.value.required_context : undefined,
      required_tools: useCaseForm.value.required_tools?.length ? useCaseForm.value.required_tools : undefined,
      potential_interactions: useCaseForm.value.potential_interactions?.length ? useCaseForm.value.potential_interactions : undefined,
      notes: useCaseForm.value.notes?.length ? useCaseForm.value.notes : undefined,
    }

    if (editingUseCase.value) {
      // Update existing
      await api.updateUseCase(document.value.id, editingUseCase.value.id, cleanForm)
    } else {
      // Create new
      await api.createUseCase(document.value.id, cleanForm)
    }
    closeUseCaseDialog()
  } catch (e) {
    console.error('Failed to save use case:', e)
  }
}

const confirmDelete = (useCase: TableRow) => {
  deleteTarget.value = { id: useCase.id, use_case: useCase.use_case }
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  deleteTarget.value = null
}

const deleteUseCase = async () => {
  if (!deleteTarget.value || !document.value) return

  try {
    await api.deleteUseCase(document.value.id, deleteTarget.value.id)
    closeDeleteDialog()
  } catch (e) {
    console.error('Failed to delete use case:', e)
  }
}

const openEditConfluenceUrlDialog = () => {
  confluenceUrlInput.value = document.value?.confluence_url || ''
  showEditConfluenceUrlDialog.value = true
}

const saveConfluenceUrl = async () => {
  if (!document.value) return

  try {
    await api.updateTableDocument(document.value.id, {
      confluence_url: confluenceUrlInput.value.trim() || undefined,
    })
    showEditConfluenceUrlDialog.value = false
  } catch (e) {
    console.error('Failed to update Confluence URL:', e)
  }
}

const pushToConfluence = async () => {
  if (!document.value?.confluence_url) {
    pushNotification.value = {
      show: true,
      message: 'No Confluence URL set for this document',
      type: 'error',
    }
    return
  }

  pushingToConfluence.value = true

  try {
    await api.pushToConfluence(document.value.id)
    pushNotification.value = {
      show: true,
      message: 'Successfully pushed to Confluence!',
      type: 'success',
    }
  } catch (err: unknown) {
    pushNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to push to Confluence',
      type: 'error',
    }
  } finally {
    pushingToConfluence.value = false
  }
}

const handleAgentRequest = async () => {
  if (!agentPrompt.value.trim() || !document.value) {
    return
  }

  agentProcessing.value = true
  const prompt = agentPrompt.value.trim()

  try {
    await api.askAgent(document.value.id, prompt)
    agentPrompt.value = ''
    agentNotification.value = {
      show: true,
      message: 'Agent request completed successfully!',
      type: 'success',
    }
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Agent request failed',
      type: 'error',
    }
  } finally {
    agentProcessing.value = false
  }
}

const appendAIPromptForUseCase = (useCase: TableRow, fieldName?: string) => {
  const fieldLabel = fieldName
    ? ` - ${fieldName.replace(/_/g, ' ')}`
    : ''
  const prompt = `Edit the use case "${useCase.use_case}"${fieldLabel}: `
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

// Field-specific editing
const openEditFieldDialog = (
  useCase: TableRow,
  fieldName: keyof Omit<TableRow, 'id'>,
  fieldLabel: string,
  fieldType: 'text' | 'textarea' | 'array'
) => {
  editFieldData.value = {
    useCaseId: useCase.id,
    fieldName,
    fieldLabel,
    fieldType,
    value: fieldType === 'array'
      ? (useCase[fieldName] as string[] || [])
      : (useCase[fieldName] as string || ''),
  }
  showEditFieldDialog.value = true
}

const saveFieldEdit = async () => {
  if (!editFieldData.value || !document.value) return

  try {
    const updates: Partial<Omit<TableRow, 'id'>> = {
      [editFieldData.value.fieldName]: editFieldData.value.fieldType === 'array'
        ? (editFieldData.value.value as string[]).length > 0
          ? editFieldData.value.value
          : undefined
        : (editFieldData.value.value as string).trim() || undefined,
    }

    await api.updateUseCase(document.value.id, editFieldData.value.useCaseId, updates)
    showEditFieldDialog.value = false
    editFieldData.value = null
  } catch (e) {
    console.error('Failed to update field:', e)
  }
}
</script>

<template>
  <div>
    <!-- Teleport breadcrumb to header title -->
    <Teleport to="#header-title-slot">
      <div>
        <span class="clickable" style="cursor: pointer" @click="goBack">Table Documents</span>
        <span class="mx-2">/</span>
        <span>{{ document?.id.replace(/-/g, ' ') || 'Loading...' }}</span>
      </div>
    </Teleport>

    <!-- Teleport action buttons to header -->
    <Teleport to="#header-actions-slot">
      <div class="d-flex">
        <v-btn
          variant="outlined"
          icon="mdi-pencil"
          class="mr-2"
          @click="openEditConfluenceUrlDialog"
        />
        <v-btn
          variant="outlined"
          icon="mdi-open-in-new"
          class="mr-2"
          :disabled="!document?.confluence_url"
          :href="document?.confluence_url"
          target="_blank"
        />
        <v-btn
          variant="outlined"
          prepend-icon="mdi-upload"
          class="mr-2"
          :loading="pushingToConfluence"
          :disabled="!document?.confluence_url || pushingToConfluence"
          @click="pushToConfluence"
        >
          Push to Confluence
        </v-btn>
      </div>
    </Teleport>

    <v-container fluid>
      <!-- Loading State -->
      <v-progress-linear v-if="loading" indeterminate />

      <!-- Error State -->
      <v-alert v-if="error" type="error" variant="tonal">
        {{ error }}
      </v-alert>

      <!-- Document Content -->
      <div v-if="document && !loading">

      <!-- Update Notification -->
      <v-snackbar v-model="showNotification" :timeout="3000" color="info">
        Document updated by external change
      </v-snackbar>

      <!-- Push Notification -->
      <v-snackbar v-model="pushNotification.show" :timeout="5000" :color="pushNotification.type">
        {{ pushNotification.message }}
      </v-snackbar>

      <!-- Agent Notification -->
      <v-snackbar v-model="agentNotification.show" :timeout="5000" :color="agentNotification.type">
        {{ agentNotification.message }}
      </v-snackbar>

      <!-- Use Cases Table -->
      <v-row class="mt-4">
        <v-col>
          <v-card>
            <v-card-title>
              <v-row align="center">
                <v-col>Use Cases</v-col>
                <v-col class="text-right">
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    @click="openAddUseCaseDialog"
                  >
                    Add Use Case
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th style="width: 5%">#</th>
                    <th style="width: 28%">Use Case</th>
                    <th style="width: 25%">Diagram</th>
                    <th style="width: 21%">Required Context</th>
                    <th style="width: 21%">Required Tools</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(useCase, index) in document.table" :key="useCase.id">
                    <td class="text-center font-weight-bold align-top">
                      <v-menu>
                        <template #activator="{ props }">
                          <span
                            v-bind="props"
                            class="index-number"
                          >
                            {{ index + 1 }}
                          </span>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            prepend-icon="mdi-robot"
                            title="Edit with AI"
                            @click="appendAIPromptForUseCase(useCase)"
                          />
                          <v-list-item
                            prepend-icon="mdi-delete"
                            title="Remove"
                            class="text-error"
                            @click="confirmDelete(useCase)"
                          />
                        </v-list>
                      </v-menu>
                    </td>
                    <td class="align-top">
                      <v-menu>
                        <template #activator="{ props }">
                          <span
                            v-bind="props"
                            class="editable-text"
                            @dblclick.stop="openEditFieldDialog(useCase, 'use_case', 'Use Case', 'textarea')"
                          >
                            {{ useCase.use_case }}
                          </span>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            prepend-icon="mdi-pencil"
                            title="Edit"
                            @click="openEditFieldDialog(useCase, 'use_case', 'Use Case', 'textarea')"
                          />
                          <v-list-item
                            prepend-icon="mdi-robot"
                            title="Edit with AI"
                            @click="appendAIPromptForUseCase(useCase, 'use case')"
                          />
                        </v-list>
                      </v-menu>
                    </td>
                    <td class="align-top">
                      <v-menu>
                        <template #activator="{ props }">
                          <div
                            v-bind="props"
                            class="editable-text"
                            @dblclick.stop="openEditFieldDialog(useCase, 'diagram', 'Mermaid Diagram', 'textarea')"
                          >
                            <div v-if="useCase.diagram" class="diagram-container">
                              <VueMermaidRender :content="useCase.diagram" />
                            </div>
                            <span v-else class="empty-placeholder">Click to add diagram...</span>
                          </div>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            prepend-icon="mdi-pencil"
                            title="Edit"
                            @click="openEditFieldDialog(useCase, 'diagram', 'Mermaid Diagram', 'textarea')"
                          />
                          <v-list-item
                            prepend-icon="mdi-robot"
                            title="Edit with AI"
                            @click="appendAIPromptForUseCase(useCase, 'diagram')"
                          />
                        </v-list>
                      </v-menu>
                    </td>
                    <td class="align-top">
                      <v-menu>
                        <template #activator="{ props }">
                          <div
                            v-bind="props"
                            class="editable-text"
                            :class="{ 'empty-placeholder': !useCase.required_context?.length }"
                            @dblclick.stop="openEditFieldDialog(useCase, 'required_context', 'Required Context', 'array')"
                          >
                            <ul v-if="useCase.required_context && useCase.required_context.length">
                              <li v-for="(item, i) in useCase.required_context" :key="i">{{ item }}</li>
                            </ul>
                            <span v-else>Click to add context...</span>
                          </div>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            prepend-icon="mdi-pencil"
                            title="Edit"
                            @click="openEditFieldDialog(useCase, 'required_context', 'Required Context', 'array')"
                          />
                          <v-list-item
                            prepend-icon="mdi-robot"
                            title="Edit with AI"
                            @click="appendAIPromptForUseCase(useCase, 'required context')"
                          />
                        </v-list>
                      </v-menu>
                    </td>
                    <td class="align-top">
                      <v-menu>
                        <template #activator="{ props }">
                          <div
                            v-bind="props"
                            class="editable-text"
                            :class="{ 'empty-placeholder': !useCase.required_tools?.length }"
                            @dblclick.stop="openEditFieldDialog(useCase, 'required_tools', 'Required Tools', 'array')"
                          >
                            <ul v-if="useCase.required_tools && useCase.required_tools.length">
                              <li v-for="(item, i) in useCase.required_tools" :key="i">{{ item }}</li>
                            </ul>
                            <span v-else>Click to add tools...</span>
                          </div>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            prepend-icon="mdi-pencil"
                            title="Edit"
                            @click="openEditFieldDialog(useCase, 'required_tools', 'Required Tools', 'array')"
                          />
                          <v-list-item
                            prepend-icon="mdi-robot"
                            title="Edit with AI"
                            @click="appendAIPromptForUseCase(useCase, 'required tools')"
                          />
                        </v-list>
                      </v-menu>
                    </td>
                  </tr>
                  <tr v-if="!document.table.length">
                    <td colspan="5" class="text-center text-grey pa-4">
                      No use cases yet. Add your first use case!
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- AI Agent Section -->
      <v-footer app fixed class="bg-surface">
        <v-container>
          <v-row>
            <v-col>
              <v-textarea
                v-model="agentPrompt"
                label="Ask AI Agent to modify this document..."
                placeholder="e.g., Add a new use case about dynamic content personalization"
                rows="2"
                variant="outlined"
                :disabled="agentProcessing"
                @keydown.ctrl.enter="handleAgentRequest"
                @keydown.meta.enter="handleAgentRequest"
              >
                <template #append>
                  <v-btn
                    icon="mdi-send"
                    color="primary"
                    :loading="agentProcessing"
                    :disabled="!agentPrompt.trim()"
                    @click="handleAgentRequest"
                  />
                </template>
              </v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-footer>
      </div>
    </v-container>

    <!-- Use Case Dialog -->
    <v-dialog v-model="showUseCaseDialog" max-width="1200px">
      <v-card>
        <v-card-title>
          {{ editingUseCase ? 'Edit Use Case' : 'Add Use Case' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="useCaseForm.use_case"
            label="Use Case Description"
            required
          />
          <v-textarea
            v-model="useCaseForm.diagram"
            label="Mermaid Diagram (optional)"
            rows="5"
            placeholder="graph TD&#10;    A[Start] --> B[End]"
          />
          <v-combobox
            v-model="useCaseForm.required_context"
            label="Required Context"
            multiple
            chips
            closable-chips
          />
          <v-combobox
            v-model="useCaseForm.required_tools"
            label="Required Tools"
            multiple
            chips
            closable-chips
          />
          <v-combobox
            v-model="useCaseForm.potential_interactions"
            label="Potential Interactions"
            multiple
            chips
            closable-chips
          />
          <v-combobox
            v-model="useCaseForm.notes"
            label="Notes"
            multiple
            chips
            closable-chips
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeUseCaseDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveUseCase">
            {{ editingUseCase ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="800px">
      <v-card>
        <v-card-title>Delete Use Case?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deleteTarget?.use_case }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" @click="deleteUseCase">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Confluence URL Dialog -->
    <v-dialog v-model="showEditConfluenceUrlDialog" max-width="1000">
      <v-card>
        <v-card-title>Edit Confluence URL</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="confluenceUrlInput"
            label="Confluence URL"
            variant="outlined"
            placeholder="https://..."
            hint="Leave empty to remove the Confluence link"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEditConfluenceUrlDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveConfluenceUrl">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Field Dialog -->
    <v-dialog v-if="editFieldData" v-model="showEditFieldDialog" max-width="1000">
      <v-card>
        <v-card-title>Edit {{ editFieldData.fieldLabel }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-if="editFieldData.fieldType === 'text'"
            v-model="editFieldData.value"
            :label="editFieldData.fieldLabel"
            variant="outlined"
          />
          <v-textarea
            v-else-if="editFieldData.fieldType === 'textarea'"
            v-model="editFieldData.value"
            :label="editFieldData.fieldLabel"
            variant="outlined"
            :rows="editFieldData.fieldName === 'diagram' ? 10 : 4"
            :placeholder="editFieldData.fieldName === 'diagram' ? 'graph TD\n    A[Start] --> B[End]' : ''"
            auto-grow
          />
          <v-combobox
            v-else-if="editFieldData.fieldType === 'array'"
            v-model="editFieldData.value"
            :label="editFieldData.fieldLabel"
            variant="outlined"
            multiple
            chips
            closable-chips
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEditFieldDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveFieldEdit">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.diagram-container {
  max-width: 100%;
  overflow: auto;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
}

.diagram-container :deep(svg) {
  max-width: 100%;
  height: auto;
}

.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.clickable:hover {
  opacity: 0.8;
}

.align-top {
  vertical-align: top !important;
  padding: 12px !important;
}

/* Editable text (clickable for menu) */
.editable-text {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
  transition: background-color 0.15s ease;
  display: block;
}

.editable-text:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.empty-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.editable-text ul {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0;
}

.editable-text ul li {
  margin-bottom: 4px;
}

.index-number {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.15s ease;
  display: inline-block;
}

.index-number:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
