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

// Confluence URL editor
const editingConfluenceUrl = ref(false)
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

const saveConfluenceUrl = async () => {
  if (!document.value) return

  try {
    await api.updateTableDocument(document.value.id, {
      confluence_url: confluenceUrlInput.value || undefined,
    })
    editingConfluenceUrl.value = false
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
          v-if="document?.confluence_url"
          variant="outlined"
          icon="mdi-open-in-new"
          class="mr-2"
          :href="document.confluence_url"
          target="_blank"
        />
        <v-btn
          v-if="document?.confluence_url"
          variant="outlined"
          icon="mdi-cloud-upload"
          class="mr-2"
          :loading="pushingToConfluence"
          @click="pushToConfluence"
        />
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

      <!-- Confluence URL Section -->
      <v-row class="mt-4">
        <v-col>
          <v-card>
            <v-card-title>Confluence Integration</v-card-title>
            <v-card-text>
              <v-row align="center">
                <v-col v-if="!editingConfluenceUrl" cols="12" md="8">
                  <div v-if="document.confluence_url">
                    <strong>URL:</strong>
                    <a :href="document.confluence_url" target="_blank" class="ml-2">
                      {{ document.confluence_url }}
                    </a>
                  </div>
                  <div v-else class="text-grey">No Confluence URL set</div>
                </v-col>
                <v-col v-else cols="12" md="8">
                  <v-text-field
                    v-model="confluenceUrlInput"
                    label="Confluence URL"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="4" class="text-right">
                  <v-btn
                    v-if="!editingConfluenceUrl"
                    prepend-icon="mdi-pencil"
                    size="small"
                    @click="editingConfluenceUrl = true"
                  >
                    Edit URL
                  </v-btn>
                  <template v-else>
                    <v-btn
                      size="small"
                      @click="editingConfluenceUrl = false"
                    >
                      Cancel
                    </v-btn>
                    <v-btn
                      color="primary"
                      size="small"
                      class="ml-2"
                      @click="saveConfluenceUrl"
                    >
                      Save
                    </v-btn>
                  </template>
                  <v-btn
                    v-if="document.confluence_url && !editingConfluenceUrl"
                    color="primary"
                    prepend-icon="mdi-cloud-upload"
                    size="small"
                    class="ml-2"
                    :loading="pushingToConfluence"
                    @click="pushToConfluence"
                  >
                    Push to Confluence
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

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
                    <th style="width: 25%">Use Case</th>
                    <th style="width: 20%">Diagram</th>
                    <th style="width: 15%">Required Context</th>
                    <th style="width: 15%">Required Tools</th>
                    <th style="width: 10%">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(useCase, index) in document.table" :key="useCase.id">
                    <td class="text-center font-weight-bold">{{ index + 1 }}</td>
                    <td>{{ useCase.use_case }}</td>
                    <td>
                      <div v-if="useCase.diagram" class="diagram-container">
                        <VueMermaidRender :content="useCase.diagram" />
                      </div>
                      <span v-else class="text-grey">—</span>
                    </td>
                    <td>
                      <ul v-if="useCase.required_context && useCase.required_context.length">
                        <li v-for="(item, i) in useCase.required_context" :key="i">{{ item }}</li>
                      </ul>
                      <span v-else class="text-grey">—</span>
                    </td>
                    <td>
                      <ul v-if="useCase.required_tools && useCase.required_tools.length">
                        <li v-for="(item, i) in useCase.required_tools" :key="i">{{ item }}</li>
                      </ul>
                      <span v-else class="text-grey">—</span>
                    </td>
                    <td>
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        @click="openEditUseCaseDialog(useCase)"
                      />
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="confirmDelete(useCase)"
                      />
                    </td>
                  </tr>
                  <tr v-if="!document.table.length">
                    <td colspan="6" class="text-center text-grey pa-4">
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
    <v-dialog v-model="showUseCaseDialog" max-width="800px">
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
    <v-dialog v-model="showDeleteDialog" max-width="500px">
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
</style>
