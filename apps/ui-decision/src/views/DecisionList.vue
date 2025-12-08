<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api, type DecisionSummary } from '../services/api'
import {
  initSocket,
  onDecisionUpdated,
  onDecisionAdded,
  onDecisionDeleted,
} from '../services/socket'

const router = useRouter()
const decisions = ref<DecisionSummary[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

// Create decision dialog state
const showCreateDialog = ref(false)
const newDecisionName = ref('')
const creating = ref(false)
const createError = ref<string | null>(null)

// Delete confirmation dialog state
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const deleting = ref(false)

// Bulk operations state
const selectedDecisions = ref<string[]>([])
const bulkPushing = ref(false)
const bulkDeleting = ref(false)
const bulkPushProgress = ref(0)
const bulkPushCurrentIndex = ref(0)
const bulkDeleteProgress = ref(0)
const bulkDeleteCurrentIndex = ref(0)
const bulkPushResults = ref<{
  show: boolean
  total: number
  successful: number
  failed: number
  results: { id: string; name: string; success: boolean; error?: string }[]
}>({
  show: false,
  total: 0,
  successful: 0,
  failed: 0,
  results: [],
})

const headers = [
  { title: 'Status', key: 'selectedOption', sortable: true, align: 'center' as const },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Directory', key: 'directory', sortable: true },
  { title: 'Problem Definition', key: 'problemDefinition', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

// Setup Socket.IO listeners (must be outside async context)
let unsubscribeUpdate: (() => void) | null = null
let unsubscribeAdd: (() => void) | null = null
let unsubscribeDelete: (() => void) | null = null

onMounted(() => {
  loading.value = true

  // Initialize Socket.IO synchronously
  initSocket()

  // Listen for decision updates (synchronous setup)
  unsubscribeUpdate = onDecisionUpdated(({ id, decision }) => {
    const index = decisions.value.findIndex((d) => d.id === id)
    if (index !== -1) {
      // Update existing decision, preserve timestamps and directory
      const existing = decisions.value[index]
      decisions.value[index] = {
        id,
        name: existing.name,
        directory: existing.directory,
        problemDefinition: decision.problemDefinition,
        selectedOption: decision.selectedOption,
        confluenceLink: decision.confluenceLink,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(), // Update timestamp on change
      }
    }
  })

  // Listen for new decisions
  unsubscribeAdd = onDecisionAdded(({ id, decision }) => {
    if (!id || !decision) return
    const exists = decisions.value.find((d) => d.id === id)
    if (!exists) {
      const now = new Date().toISOString()
      const parts = id.split('/')
      const lastPart = parts[parts.length - 1]
      const name = lastPart ? lastPart.replace(/-/g, ' ') : 'Untitled'
      const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : ''
      decisions.value.push({
        id,
        name,
        directory,
        problemDefinition: decision.problemDefinition,
        selectedOption: decision.selectedOption,
        confluenceLink: decision.confluenceLink,
        createdAt: now,
        updatedAt: now,
      })
    }
  })

  // Listen for deleted decisions
  unsubscribeDelete = onDecisionDeleted(({ id }) => {
    const index = decisions.value.findIndex((d) => d.id === id)
    if (index !== -1) {
      decisions.value.splice(index, 1)
    }
  })

  // Load decisions asynchronously (don't await in onMounted)
  void (async () => {
    try {
      decisions.value = await api.getDecisions()
    } catch (e) {
      error.value =
        'Failed to load decisions. Make sure the backend is running on http://localhost:3000'
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

// Computed properties for bulk operations
const canPushSelected = computed(() => {
  return selectedDecisions.value.every((id) => {
    const decision = decisions.value.find((d) => d.id === id)
    return decision?.confluenceLink
  })
})

// Bulk operations functions
const clearSelection = () => {
  selectedDecisions.value = []
}

const bulkPushToConfluence = async () => {
  // Validate all selected decisions have Confluence links
  const invalidDecisions = selectedDecisions.value.filter((id) => {
    const decision = decisions.value.find((d) => d.id === id)
    return !decision?.confluenceLink
  })

  if (invalidDecisions.length > 0) {
    alert(`${invalidDecisions.length} selected decision(s) don't have Confluence links`)
    return
  }

  bulkPushing.value = true
  bulkPushCurrentIndex.value = 0
  bulkPushProgress.value = 0

  const results: { id: string; name: string; success: boolean; error?: string }[] = []

  // Process each decision sequentially to avoid overwhelming the server
  for (let i = 0; i < selectedDecisions.value.length; i++) {
    const decisionId = selectedDecisions.value[i]
    const decision = decisions.value.find((d) => d.id === decisionId)

    if (!decision) continue

    bulkPushCurrentIndex.value = i + 1
    bulkPushProgress.value = Math.round(((i + 1) / selectedDecisions.value.length) * 100)

    try {
      await api.pushToConfluence(decisionId, decision.confluenceLink!)
      results.push({
        id: decisionId,
        name: decision.name,
        success: true,
      })
    } catch (error: unknown) {
      results.push({
        id: decisionId,
        name: decision.name,
        success: false,
        error: (error as Error).message ?? 'Unknown error',
      })
    }
  }

  // Update results
  bulkPushResults.value = {
    show: true,
    total: selectedDecisions.value.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  }

  bulkPushing.value = false

  // Clear selection after push
  selectedDecisions.value = []
}

const goToDetail = (id: string) => {
  void router.push(`/${id}`)
}

const copyConfluenceUrl = async (decision: DecisionSummary) => {
  if (decision.confluenceLink) {
    try {
      await navigator.clipboard.writeText(decision.confluenceLink)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      alert('Failed to copy URL to clipboard')
    }
  }
}

const openInConfluence = (decision: DecisionSummary) => {
  if (decision.confluenceLink) {
    window.open(decision.confluenceLink, '_blank')
  }
}

const confirmDelete = (decision: DecisionSummary) => {
  deleteTarget.value = { id: decision.id, name: decision.name }
  showDeleteDialog.value = true
}

const handleDeleteDecision = async () => {
  if (!deleteTarget.value) return

  deleting.value = true
  try {
    await api.deleteDecision(deleteTarget.value.id)
    // Remove from local list
    const index = decisions.value.findIndex((d) => d.id === deleteTarget.value!.id)
    if (index !== -1) {
      decisions.value.splice(index, 1)
    }
    showDeleteDialog.value = false
  } catch (err: unknown) {
    alert((err as Error).message ?? 'Failed to delete decision')
  } finally {
    deleting.value = false
  }
}

const confirmBulkDelete = () => {
  deleteTarget.value = null // Use null to indicate bulk delete
  showDeleteDialog.value = true
}

const handleBulkDelete = async () => {
  bulkDeleting.value = true
  bulkDeleteCurrentIndex.value = 0
  bulkDeleteProgress.value = 0

  const toDelete = [...selectedDecisions.value]
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < toDelete.length; i++) {
    const id = toDelete[i]
    bulkDeleteCurrentIndex.value = i + 1
    bulkDeleteProgress.value = Math.round(((i + 1) / toDelete.length) * 100)

    try {
      await api.deleteDecision(id)
      // Remove from local list
      const index = decisions.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        decisions.value.splice(index, 1)
      }
      successCount++
    } catch {
      failCount++
    }
  }

  bulkDeleting.value = false
  selectedDecisions.value = []
  showDeleteDialog.value = false

  if (failCount > 0) {
    alert(`Deleted ${successCount} decisions. ${failCount} failed.`)
  }
}

const openCreateDialog = () => {
  newDecisionName.value = ''
  createError.value = null
  showCreateDialog.value = true
}

const handleCreateDecision = async () => {
  if (!newDecisionName.value.trim()) {
    createError.value = 'Please enter a name'
    return
  }

  creating.value = true
  createError.value = null

  try {
    const result = await api.createDecision(newDecisionName.value.trim())
    showCreateDialog.value = false
    // Navigate to the new decision
    void router.push(`/${result.id}`)
  } catch (err: unknown) {
    createError.value = (err as Error).message ?? 'Failed to create decision'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div>
    <!-- Teleport title to header -->
    <Teleport to="#header-title-slot">
      <div>Decision Documents</div>
    </Teleport>

    <!-- Teleport "New Decision" button to header -->
    <Teleport to="#header-actions-slot">
      <v-btn variant="outlined" prepend-icon="mdi-plus" @click="openCreateDialog">
        New Decision
      </v-btn>
    </Teleport>

    <v-container fluid>
      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" />
          <p class="mt-4">
            Loading decisions...
          </p>
        </v-col>
      </v-row>

      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Search decisions"
                single-line
                hide-details
                clearable
                variant="outlined"
                density="compact"
                class="mb-4"
              />
            </v-card-title>
            <v-data-table
              v-model="selectedDecisions"
              :headers="headers"
              :items="decisions"
              :search="search"
              :loading="loading"
              :items-per-page="50"
              :sort-by="[{ key: 'name', order: 'asc' }]"
              item-value="id"
              show-select
              select-strategy="page"
            >
              <template #[`item.name`]="{ item }">
                <span class="font-weight-medium">{{ item.name }}</span>
              </template>
              <template #[`item.directory`]="{ item }">
                <span class="text-grey">{{ item.directory ?? '(root)' }}</span>
              </template>
              <template #[`item.selectedOption`]="{ item }">
                <v-chip
                  v-if="item.selectedOption"
                  color="success"
                  variant="tonal"
                  size="small"
                >
                  <v-icon start size="small">
                    mdi-check-circle
                  </v-icon>
                  Decided
                </v-chip>
                <span v-else class="text-grey">Pending</span>
              </template>
              <template #[`item.createdAt`]="{ item }">
                <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
              </template>
              <template #[`item.updatedAt`]="{ item }">
                <span class="text-body-2">{{ formatDate(item.updatedAt) }}</span>
              </template>
              <template #[`item.actions`]="{ item }">
                <div class="action-buttons">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    title="Edit"
                    @click="goToDetail(item.id)"
                  />
                  <v-btn
                    icon="mdi-content-copy"
                    size="small"
                    variant="text"
                    :disabled="!item.confluenceLink"
                    title="Copy Confluence URL"
                    @click="copyConfluenceUrl(item)"
                  />
                  <v-btn
                    icon="mdi-open-in-new"
                    size="small"
                    variant="text"
                    :disabled="!item.confluenceLink"
                    title="Open in Confluence"
                    @click="openInConfluence(item)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    title="Delete"
                    @click="confirmDelete(item)"
                  />
                </div>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="!loading && !error && decisions.length === 0">
        <v-col cols="12">
          <v-alert type="info" variant="tonal">
            No decisions found
          </v-alert>
        </v-col>
      </v-row>
    </v-container>

    <!-- Bulk Actions Toolbar -->
    <v-expand-transition>
      <v-toolbar
        v-if="selectedDecisions.length > 0"
        color="primary"
        dark
        prominent
        class="bulk-actions-toolbar"
        elevation="8"
      >
        <v-toolbar-title>
          {{ selectedDecisions.length }} decision{{ selectedDecisions.length > 1 ? 's' : '' }}
          selected
        </v-toolbar-title>

        <v-spacer />

        <v-btn variant="text" prepend-icon="mdi-close" @click="clearSelection">
          Clear Selection
        </v-btn>

        <v-btn
          variant="elevated"
          color="error"
          prepend-icon="mdi-delete"
          class="mr-2"
          :disabled="bulkPushing || bulkDeleting"
          @click="confirmBulkDelete"
        >
          Delete {{ selectedDecisions.length }}
        </v-btn>

        <v-btn
          variant="elevated"
          prepend-icon="mdi-upload"
          :loading="bulkPushing"
          :disabled="!canPushSelected || bulkPushing || bulkDeleting"
          @click="bulkPushToConfluence"
        >
          Push {{ selectedDecisions.length }} to Confluence
        </v-btn>
      </v-toolbar>
    </v-expand-transition>

    <!-- Progress Overlay during bulk push -->
    <v-overlay v-model="bulkPushing" class="align-center justify-center">
      <v-card min-width="400" class="pa-4">
        <v-card-text class="text-center">
          <v-progress-circular
            :model-value="bulkPushProgress"
            :size="100"
            :width="10"
            color="primary"
          >
            {{ bulkPushProgress }}%
          </v-progress-circular>
          <p class="mt-4 text-h6">
            Pushing to Confluence...
          </p>
          <p class="text-body-2">
            {{ bulkPushCurrentIndex }} of {{ selectedDecisions.length }}
          </p>
        </v-card-text>
      </v-card>
    </v-overlay>

    <!-- Progress Overlay during bulk delete -->
    <v-overlay v-model="bulkDeleting" class="align-center justify-center">
      <v-card min-width="400" class="pa-4">
        <v-card-text class="text-center">
          <v-progress-circular
            :model-value="bulkDeleteProgress"
            :size="100"
            :width="10"
            color="error"
          >
            {{ bulkDeleteProgress }}%
          </v-progress-circular>
          <p class="mt-4 text-h6">
            Deleting decisions...
          </p>
          <p class="text-body-2">
            {{ bulkDeleteCurrentIndex }} of {{ selectedDecisions.length }}
          </p>
        </v-card-text>
      </v-card>
    </v-overlay>

    <!-- Bulk Push Results Dialog -->
    <v-dialog v-model="bulkPushResults.show" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon :color="bulkPushResults.failed === 0 ? 'success' : 'warning'" class="mr-2">
            {{ bulkPushResults.failed === 0 ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          Bulk Push Results
        </v-card-title>

        <v-card-text>
          <v-alert
            :type="bulkPushResults.failed === 0 ? 'success' : 'warning'"
            variant="tonal"
            class="mb-4"
          >
            Successfully pushed {{ bulkPushResults.successful }} of
            {{ bulkPushResults.total }} decisions
          </v-alert>

          <v-list>
            <v-list-item v-for="result in bulkPushResults.results" :key="result.id">
              <template #prepend>
                <v-icon :color="result.success ? 'success' : 'error'">
                  {{ result.success ? 'mdi-check' : 'mdi-close' }}
                </v-icon>
              </template>

              <v-list-item-title>{{ result.name }}</v-list-item-title>
              <v-list-item-subtitle v-if="!result.success" class="text-error">
                {{ result.error }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="bulkPushResults.show = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">
            mdi-alert
          </v-icon>
          Confirm Delete
        </v-card-title>
        <v-card-text>
          <template v-if="deleteTarget">
            Are you sure you want to delete "<strong>{{ deleteTarget.name }}</strong>"? This action cannot be undone.
          </template>
          <template v-else>
            Are you sure you want to delete
            <strong>{{ selectedDecisions.length }}</strong> decision{{
              selectedDecisions.length > 1 ? 's' : ''
            }}? This action cannot be undone.
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="deleting || bulkDeleting"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleting || bulkDeleting"
            @click="deleteTarget ? handleDeleteDecision() : handleBulkDelete()"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Decision Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="500" persistent>
      <v-card>
        <v-card-title>Create New Decision</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newDecisionName"
            label="Decision name"
            placeholder="e.g. which-database-to-use"
            variant="outlined"
            autofocus
            :error-messages="createError ? [createError] : []"
            hint="Will be converted to a filename (lowercase, hyphens)"
            persistent-hint
            @keyup.enter="handleCreateDecision"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="creating" @click="showCreateDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="creating"
            @click="handleCreateDecision"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.bulk-actions-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.action-buttons {
  display: flex;
  gap: 4px;
  white-space: nowrap;
}

:deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}
</style>
