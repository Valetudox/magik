<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, type TableDocumentSummary } from '../services/api'
import {
  initSocket,
  onTableDocumentUpdated,
  onTableDocumentAdded,
  onTableDocumentDeleted,
} from '../services/socket'

const router = useRouter()
const documents = ref<TableDocumentSummary[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

// Create document dialog state
const showCreateDialog = ref(false)
const newDocumentName = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)

// Delete confirmation dialog state
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const deleting = ref(false)

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Directory', key: 'directory', sortable: true },
  { title: 'Use Cases', key: 'useCaseCount', sortable: true, align: 'center' as const },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

// Setup Socket.IO listeners
let unsubscribeUpdate: (() => void) | null = null
let unsubscribeAdd: (() => void) | null = null
let unsubscribeDelete: (() => void) | null = null

onMounted(() => {
  loading.value = true

  // Initialize Socket.IO
  initSocket()

  // Listen for document updates
  unsubscribeUpdate = onTableDocumentUpdated(({ id, document }) => {
    const index = documents.value.findIndex((d) => d.id === id)
    if (index !== -1) {
      const existing = documents.value[index]
      documents.value[index] = {
        id,
        name: existing.name,
        directory: existing.directory,
        useCaseCount: document.table.length,
        confluence_url: document.confluence_url,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      }
    }
  })

  // Listen for new documents
  unsubscribeAdd = onTableDocumentAdded(({ id, document }) => {
    if (!id || !document) return
    const exists = documents.value.find((d) => d.id === id)
    if (!exists) {
      const now = new Date().toISOString()
      const parts = id.split('/')
      const lastPart = parts[parts.length - 1]
      const name = lastPart ? lastPart.replace(/-/g, ' ') : 'Untitled'
      const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : ''
      documents.value.push({
        id,
        name,
        directory,
        useCaseCount: document.table.length,
        confluence_url: document.confluence_url,
        createdAt: now,
        updatedAt: now,
      })
    }
  })

  // Listen for deleted documents
  unsubscribeDelete = onTableDocumentDeleted(({ id }) => {
    const index = documents.value.findIndex((d) => d.id === id)
    if (index !== -1) {
      documents.value.splice(index, 1)
    }
  })

  // Load documents
  void (async () => {
    try {
      documents.value = await api.getTableDocuments()
    } catch (e) {
      error.value = 'Failed to load table documents. Make sure the backend is running on http://localhost:4004'
      console.error(e)
    } finally {
      loading.value = false
    }
  })()
})

// Cleanup on unmount
onUnmounted(() => {
  if (unsubscribeUpdate) unsubscribeUpdate()
  if (unsubscribeAdd) unsubscribeAdd()
  if (unsubscribeDelete) unsubscribeDelete()
})

// Helper functions
const formatDate = (isoString: string) => {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const openDocument = (id: string) => {
  router.push(`/${id}`)
}

const openCreateDialog = () => {
  newDocumentName.value = ''
  createError.value = null
  showCreateDialog.value = true
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
  newDocumentName.value = ''
  createError.value = null
}

const createDocument = async () => {
  if (!newDocumentName.value.trim()) {
    createError.value = 'Document name is required'
    return
  }

  creating.value = true
  createError.value = null

  try {
    const result = await api.createTableDocument(newDocumentName.value.trim())
    closeCreateDialog()
    // Navigate to the new document
    router.push(`/${result.id}`)
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Failed to create document'
  } finally {
    creating.value = false
  }
}

const confirmDelete = (document: TableDocumentSummary) => {
  deleteTarget.value = { id: document.id, name: document.name }
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  deleteTarget.value = null
}

const deleteDocument = async () => {
  if (!deleteTarget.value) return

  deleting.value = true

  try {
    await api.deleteTableDocument(deleteTarget.value.id)
    closeDeleteDialog()
  } catch (e) {
    console.error('Failed to delete document:', e)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <v-container fluid>
    <!-- Header -->
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4">Table Documents</h1>
      </v-col>
    </v-row>

    <!-- Toolbar -->
    <v-row>
      <v-col>
        <v-card>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  label="Search documents"
                  single-line
                  hide-details
                  clearable
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="6" class="text-right">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="openCreateDialog"
                >
                  Create Document
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-row v-if="error">
      <v-col>
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-row>
      <v-col>
        <v-card>
          <v-data-table
            :headers="headers"
            :items="documents"
            :loading="loading"
            :search="search"
            item-value="id"
            class="elevation-1"
          >
            <template #item.name="{ item }">
              <a
                href="#"
                class="text-decoration-none text-primary"
                @click.prevent="openDocument(item.id)"
              >
                {{ item.name }}
              </a>
            </template>

            <template #item.directory="{ item }">
              <span v-if="item.directory" class="text-grey">
                {{ item.directory }}
              </span>
              <span v-else class="text-grey-darken-1">—</span>
            </template>

            <template #item.useCaseCount="{ item }">
              <v-chip size="small" color="primary" variant="tonal">
                {{ item.useCaseCount }}
              </v-chip>
            </template>

            <template #item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <template #item.updatedAt="{ item }">
              {{ formatDate(item.updatedAt) }}
            </template>

            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-open-in-new"
                size="small"
                variant="text"
                @click="openDocument(item.id)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Document Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="500px">
      <v-card>
        <v-card-title>Create New Table Document</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newDocumentName"
            label="Document Name"
            placeholder="e.g., agentic-use-cases"
            hint="Use lowercase letters, numbers, hyphens, and slashes for paths"
            persistent-hint
            :error-messages="createError ? [createError] : []"
            @keyup.enter="createDocument"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeCreateDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="creating"
            @click="createDocument"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete Document?</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deleteTarget?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteDocument"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
