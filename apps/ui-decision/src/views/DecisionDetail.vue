<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  EntityDetailPage,
  NameDescriptionDialog,
  TextEditDialog,
} from '@magik/ui-shared'
import { api, type DecisionDetail } from '../services/api'
import { initSocket, onDecisionUpdated } from '../services/socket'
import OptionDialog from '../components/OptionDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import {
  ProblemDefinitionSection,
  ComponentsSection,
  UseCasesSection,
  ProposalSection,
  EvaluationMatrix,
} from '../components/decision-detail'

const route = useRoute()
const router = useRouter()
const decision = ref<DecisionDetail | null>(null)
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

// Option, Driver, Component, and UseCase dialog state
const showOptionDialog = ref(false)
const showDriverDialog = ref(false)
const showComponentDialog = ref(false)
const showUseCaseDialog = ref(false)
const editingOption = ref<{
  id: string
  name: string
  description: string
  moreLink?: string
} | null>(null)
const editingDriver = ref<{ id: string; name: string; description: string } | null>(null)
const editingComponent = ref<{ id: string; name: string; description: string } | null>(null)
const editingUseCase = ref<{ id: string; name: string; description: string } | null>(null)

// Confirm dialog state
const showConfirmDialog = ref(false)
const confirmDialogData = ref<{
  title: string
  message: string
  onConfirm: () => void
} | null>(null)

// Setup Socket.IO listeners before mounting (must be synchronous)
let unsubscribeUpdate: (() => void) | null = null

onMounted(() => {
  const id = route.params.id as string
  loading.value = true

  // Initialize Socket.IO synchronously
  initSocket()

  // Listen for decision updates (synchronous setup)
  unsubscribeUpdate = onDecisionUpdated(({ id: updatedId, decision: updatedDecision }) => {
    const currentId = route.params.id as string
    if (updatedId === currentId) {
      decision.value = updatedDecision
      showNotification.value = true
    }
  })

  // Load decision data asynchronously (don't await in onMounted)
  void (async () => {
    try {
      decision.value = await api.getDecision(id)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) {
        error.value = 'Decision not found'
      } else {
        error.value =
          'Failed to load decision. Make sure the backend is running on http://localhost:3000'
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


const copyConfluenceUrl = async () => {
  if (decision.value?.confluenceLink) {
    try {
      await navigator.clipboard.writeText(decision.value.confluenceLink)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      alert('Failed to copy URL to clipboard')
    }
  }
}

const openInConfluence = () => {
  if (decision.value?.confluenceLink) {
    window.open(decision.value.confluenceLink, '_blank')
  }
}

const pushToConfluence = async () => {
  if (!decision.value?.confluenceLink) {
    pushNotification.value = {
      show: true,
      message: 'No Confluence link found for this decision',
      type: 'error',
    }
    return
  }

  pushingToConfluence.value = true

  try {
    const id = route.params.id as string
    await api.pushToConfluence(id, decision.value.confluenceLink)

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

const pullFromConfluence = () => {
  // TODO: Implement pull from Confluence
  alert('Pull from Confluence - Not implemented yet')
}

const handleAgentRequest = async () => {
  if (!agentPrompt.value.trim()) {
    return
  }

  agentProcessing.value = true
  const prompt = agentPrompt.value.trim()

  try {
    const id = route.params.id as string
    await api.askAgent(id, prompt)

    // Clear input
    agentPrompt.value = ''
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to process request',
      type: 'error',
    }
  } finally {
    agentProcessing.value = false
  }
}


// Option handlers
const openAddOptionDialog = () => {
  editingOption.value = null
  showOptionDialog.value = true
}

const openEditOptionDialog = (option: {
  id: string
  name: string
  description: string
  moreLink?: string
}) => {
  editingOption.value = option
  showOptionDialog.value = true
}

const handleSaveOption = async (option: {
  name: string
  description: string
  moreLink?: string
}) => {
  try {
    const decisionId = route.params.id as string
    if (editingOption.value) {
      await api.updateOption(decisionId, editingOption.value.id, option)
    } else {
      await api.createOption(decisionId, option)
    }
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to save option',
      type: 'error',
    }
  }
}

const confirmDeleteOption = (option: { id: string; name: string }) => {
  confirmDialogData.value = {
    title: 'Delete Option',
    message: `Are you sure you want to delete "${option.name}"? This will also remove all evaluations for this option.`,
    onConfirm: () => {
      void (async () => {
        try {
          const decisionId = route.params.id as string
          await api.deleteOption(decisionId, option.id)
        } catch (err: unknown) {
            agentNotification.value = {
              show: true,
              message: (err as Error).message ?? 'Failed to delete option',
              type: 'error',
            }
          }
      })()
    },
  }
  showConfirmDialog.value = true
}

const handleSetSelectedOption = async (optionId: string | null) => {
  try {
    const decisionId = route.params.id as string
    await api.setSelectedOption(decisionId, optionId)
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update selection',
      type: 'error',
    }
  }
}


// EvaluationMatrix event handlers
const handleUpdateRating = async (optionId: string, driverId: string, rating: 'high' | 'medium' | 'low' | null) => {
  try {
    const decisionId = route.params.id as string
    await api.updateEvaluationRating(decisionId, optionId, driverId, rating)
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update rating',
      type: 'error',
    }
  }
}

const handleUpdateEvaluationDetails = async (optionId: string, driverId: string, details: string[]) => {
  try {
    const decisionId = route.params.id as string
    await api.updateEvaluationDetails(decisionId, optionId, driverId, details)
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update evaluation details',
      type: 'error',
    }
  }
}

const handleUpdateOptionDescription = async (optionId: string, description: string) => {
  const option = decision.value?.options.find((o) => o.id === optionId)
  if (!option) return

  try {
    const decisionId = route.params.id as string
    await api.updateOption(decisionId, optionId, {
      name: option.name,
      description,
      moreLink: option.moreLink,
    })
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update description',
      type: 'error',
    }
  }
}

const handleUpdateOptionDiagram = async (_optionId: string, _diagram: string) => {
  // TODO: Add API method to update architecture diagram
  agentNotification.value = {
    show: true,
    message: 'Diagram update not yet implemented',
    type: 'error',
  }
}

const handleEvaluationEditAi = (context: { type: 'evaluation' | 'description' | 'diagram'; optionName: string; driverName?: string }) => {
  let prompt = ''
  if (context.type === 'evaluation' && context.driverName) {
    prompt = `Edit the "${context.optionName}" - "${context.driverName}" evaluation: `
  } else if (context.type === 'description') {
    prompt = `Edit the description of "${context.optionName}": `
  } else if (context.type === 'diagram') {
    prompt = `Edit the architecture diagram of "${context.optionName}": `
  }
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

// Driver handlers
const openAddDriverDialog = () => {
  editingDriver.value = null
  showDriverDialog.value = true
}

const openEditDriverDialog = (driver: { id: string; name: string; description: string }) => {
  editingDriver.value = driver
  showDriverDialog.value = true
}

const handleSaveDriver = async (driver: { name: string; description: string }) => {
  try {
    const decisionId = route.params.id as string
    if (editingDriver.value) {
      await api.updateDriver(decisionId, editingDriver.value.id, driver)
    } else {
      await api.createDriver(decisionId, driver)
    }
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to save driver',
      type: 'error',
    }
  }
}

const confirmDeleteDriver = (driver: { id: string; name: string }) => {
  confirmDialogData.value = {
    title: 'Delete Driver',
    message: `Are you sure you want to delete "${driver.name}"? This will also remove all evaluations for this driver.`,
    onConfirm: () => {
      void (async () => {
        try {
          const decisionId = route.params.id as string
          await api.deleteDriver(decisionId, driver.id)
        } catch (err: unknown) {
          agentNotification.value = {
            show: true,
            message: (err as Error).message ?? 'Failed to delete driver',
            type: 'error',
          }
        }
      })()
    },
  }
  showConfirmDialog.value = true
}

const handleConfirmDialogConfirm = () => {
  if (confirmDialogData.value?.onConfirm) {
    confirmDialogData.value.onConfirm()
  }
}

// Component handlers
const openAddComponentDialog = () => {
  editingComponent.value = null
  showComponentDialog.value = true
}

const openEditComponentDialog = (component: { id: string; name: string; description: string }) => {
  editingComponent.value = component
  showComponentDialog.value = true
}

const handleSaveComponent = async (component: { name: string; description: string }) => {
  try {
    const decisionId = route.params.id as string
    if (editingComponent.value) {
      await api.updateComponent(decisionId, editingComponent.value.id, component)
    } else {
      await api.createComponent(decisionId, component)
    }
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to save component',
      type: 'error',
    }
  }
}

const confirmDeleteComponent = (component: { id: string; name: string }) => {
  confirmDialogData.value = {
    title: 'Delete Component',
    message: `Are you sure you want to delete "${component.name}"?`,
    onConfirm: () => {
      void (async () => {
        try {
          const decisionId = route.params.id as string
          await api.deleteComponent(decisionId, component.id)
        } catch (err: unknown) {
          agentNotification.value = {
            show: true,
            message: (err as Error).message ?? 'Failed to delete component',
            type: 'error',
          }
        }
      })()
    },
  }
  showConfirmDialog.value = true
}

// Use Case handlers
const openAddUseCaseDialog = () => {
  editingUseCase.value = null
  showUseCaseDialog.value = true
}

const openEditUseCaseDialog = (useCase: { id: string; name: string; description: string }) => {
  editingUseCase.value = useCase
  showUseCaseDialog.value = true
}

const handleSaveUseCase = async (useCase: { name: string; description: string }) => {
  try {
    const decisionId = route.params.id as string
    if (editingUseCase.value) {
      await api.updateUseCase(decisionId, editingUseCase.value.id, useCase)
    } else {
      await api.createUseCase(decisionId, useCase)
    }
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to save use case',
      type: 'error',
    }
  }
}

const confirmDeleteUseCase = (useCase: { id: string; name: string }) => {
  confirmDialogData.value = {
    title: 'Delete Use Case',
    message: `Are you sure you want to delete "${useCase.name}"?`,
    onConfirm: () => {
      void (async () => {
        try {
          const decisionId = route.params.id as string
          await api.deleteUseCase(decisionId, useCase.id)
        } catch (err: unknown) {
          agentNotification.value = {
            show: true,
            message: (err as Error).message ?? 'Failed to delete use case',
            type: 'error',
          }
        }
      })()
    },
  }
  showConfirmDialog.value = true
}

const handleSaveProblemDefinition = async (value: string) => {
  try {
    const decisionId = route.params.id as string
    await api.updateDecision(decisionId, { problemDefinition: value })
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update problem definition',
      type: 'error',
    }
  }
}

const handleSaveProposalDesc = async (value: string | string[]) => {
  try {
    const decisionId = route.params.id as string
    await api.updateDecision(decisionId, {
      proposal: {
        description: value as string,
        reasoning: decision.value?.proposal.reasoning ?? [],
      },
    })
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update proposal',
      type: 'error',
    }
  }
}

const handleSaveProposalReasoning = async (value: string | string[]) => {
  try {
    const decisionId = route.params.id as string
    await api.updateDecision(decisionId, {
      proposal: {
        description: decision.value?.proposal.description ?? '',
        reasoning: value as string[],
      },
    })
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update reasoning',
      type: 'error',
    }
  }
}

const appendAIPromptForProblem = () => {
  const prompt = 'Edit the problem definition: '
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

const appendAIPromptForProposalDesc = () => {
  const prompt = 'Edit the proposal description: '
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

const appendAIPromptForProposalReasoning = () => {
  const prompt = 'Edit the proposal reasoning: '
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

const appendAIPromptForComponent = (component: { id: string; name: string }) => {
  const prompt = `Edit the component "${component.name}": `
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

const appendAIPromptForUseCase = (useCase: { id: string; name: string }) => {
  const prompt = `Edit the use case "${useCase.name}": `
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

// Confluence URL edit dialog state
const showEditConfluenceUrlDialog = ref(false)

const openEditConfluenceUrlDialog = () => {
  showEditConfluenceUrlDialog.value = true
}

const handleSaveConfluenceUrl = async (value: string) => {
  try {
    const decisionId = route.params.id as string
    await api.updateDecision(decisionId, { confluenceLink: value })
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update Confluence URL',
      type: 'error',
    }
  }
}
</script>

<template>
  <EntityDetailPage page-title="Decision Documents">
    <template #title>
      <span class="clickable" @click="goBack">Decision Documents</span>
      <span class="mx-2">/</span>
      <span>{{ decision?.id.replace(/-/g, ' ') || 'Loading...' }}</span>
    </template>

    <template #headerActions>
      <v-btn
        variant="outlined"
        icon="mdi-pencil"
        class="mr-2"
        @click="openEditConfluenceUrlDialog"
      />
      <v-btn
        variant="outlined"
        icon="mdi-content-copy"
        class="mr-2"
        :disabled="!decision?.confluenceLink"
        @click="copyConfluenceUrl"
      />
      <v-btn
        variant="outlined"
        icon="mdi-open-in-new"
        class="mr-2"
        :disabled="!decision?.confluenceLink"
        @click="openInConfluence"
      />
      <v-btn
        variant="outlined"
        prepend-icon="mdi-upload"
        class="mr-2"
        :loading="pushingToConfluence"
        :disabled="!decision?.confluenceLink || pushingToConfluence"
        @click="pushToConfluence"
      >
        Push to Confluence
      </v-btn>
      <v-btn variant="outlined" prepend-icon="mdi-download" @click="pullFromConfluence">
        Pull from Confluence
      </v-btn>
    </template>

    <template #sidebar>
      <template v-if="decision">
        <ProblemDefinitionSection
          :value="decision.problemDefinition"
          @update="handleSaveProblemDefinition"
          @edit-ai="appendAIPromptForProblem"
        />

        <ComponentsSection
          :components="decision.components ?? []"
          @add="openAddComponentDialog"
          @edit="openEditComponentDialog"
          @delete="confirmDeleteComponent"
          @edit-ai="appendAIPromptForComponent"
        />

        <UseCasesSection
          :use-cases="decision.useCases ?? []"
          @add="openAddUseCaseDialog"
          @edit="openEditUseCaseDialog"
          @delete="confirmDeleteUseCase"
          @edit-ai="appendAIPromptForUseCase"
        />

        <ProposalSection
          :proposal="decision.proposal"
          @update:description="handleSaveProposalDesc"
          @update:reasoning="handleSaveProposalReasoning"
          @edit-ai:description="appendAIPromptForProposalDesc"
          @edit-ai:reasoning="appendAIPromptForProposalReasoning"
        />
      </template>
    </template>

    <!-- Main content area -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4">Loading decision...</p>
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal">
      {{ error }}
    </v-alert>

    <template v-else-if="decision">
      <EvaluationMatrix
        :options="decision.options"
        :drivers="decision.decisionDrivers"
        :evaluation-matrix="decision.evaluationMatrix"
        :selected-option="decision.selectedOption"
        @add-option="openAddOptionDialog"
        @add-driver="openAddDriverDialog"
        @edit-option="openEditOptionDialog"
        @delete-option="confirmDeleteOption"
        @select-option="handleSetSelectedOption"
        @edit-driver="openEditDriverDialog"
        @delete-driver="confirmDeleteDriver"
        @update-rating="handleUpdateRating"
        @update-evaluation-details="handleUpdateEvaluationDetails"
        @update-option-description="handleUpdateOptionDescription"
        @update-option-diagram="handleUpdateOptionDiagram"
        @edit-ai="handleEvaluationEditAi"
      />
    </template>

    <!-- AI Agent Input -->
    <div class="agent-input-container">
      <v-textarea
        v-model="agentPrompt"
        placeholder="Ask the AI to modify this decision..."
        variant="outlined"
        hide-details
        auto-grow
        rows="1"
        :loading="agentProcessing"
        :disabled="agentProcessing"
        @keyup.ctrl.enter="handleAgentRequest"
        @keyup.meta.enter="handleAgentRequest"
      >
        <template #append-inner>
          <v-btn
            icon="mdi-send"
            variant="text"
            :loading="agentProcessing"
            :disabled="!agentPrompt.trim() || agentProcessing"
            @click="handleAgentRequest"
          />
        </template>
      </v-textarea>
    </div>

    <!-- Real-time update notification -->
    <v-snackbar
      v-model="showNotification"
      :timeout="3000"
      color="success"
      location="top"
    >
      <v-icon start>
        mdi-refresh
      </v-icon>
      Decision updated in real-time
    </v-snackbar>

    <!-- Push to Confluence notification -->
    <v-snackbar
      v-model="pushNotification.show"
      :timeout="5000"
      :color="pushNotification.type"
      location="bottom"
    >
      <v-icon start>
        {{ pushNotification.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
      </v-icon>
      {{ pushNotification.message }}
    </v-snackbar>

    <!-- Agent notification -->
    <v-snackbar
      v-model="agentNotification.show"
      :timeout="5000"
      :color="agentNotification.type"
      location="bottom"
    >
      <v-icon start>
        {{ agentNotification.type === 'success' ? 'mdi-robot' : 'mdi-alert-circle' }}
      </v-icon>
      {{ agentNotification.message }}
    </v-snackbar>

    <!-- Option Dialog -->
    <OptionDialog
      v-model="showOptionDialog"
      :edit-option="editingOption"
      @save="handleSaveOption"
    />

    <!-- Driver Dialog -->
    <NameDescriptionDialog
      v-model="showDriverDialog"
      entity-name="Decision Driver"
      :edit-item="editingDriver"
      :description-max-length="500"
      @save="handleSaveDriver"
    />

    <!-- Component Dialog -->
    <NameDescriptionDialog
      v-model="showComponentDialog"
      entity-name="Component"
      :edit-item="editingComponent"
      @save="handleSaveComponent"
    />

    <!-- Use Case Dialog -->
    <NameDescriptionDialog
      v-model="showUseCaseDialog"
      entity-name="Use Case"
      :edit-item="editingUseCase"
      @save="handleSaveUseCase"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-if="confirmDialogData"
      v-model="showConfirmDialog"
      :title="confirmDialogData.title"
      :message="confirmDialogData.message"
      @confirm="handleConfirmDialogConfirm"
    />

    <!-- Edit Confluence URL Dialog -->
    <TextEditDialog
      v-model="showEditConfluenceUrlDialog"
      title="Edit Confluence URL"
      label="Confluence URL"
      :value="decision?.confluenceLink ?? ''"
      :multiline="false"
      placeholder="https://..."
      hint="Leave empty to remove the Confluence link"
      :required="false"
      @save="handleSaveConfluenceUrl"
    />
  </EntityDetailPage>
</template>

<style scoped>
:deep(.v-table) {
  overflow: hidden;
  table-layout: fixed;
  width: 100%;
}

:deep(.v-table thead th:first-child),
:deep(.v-table tbody th:first-child),
:deep(.v-table tbody td:first-child) {
  width: 15% !important;
  min-width: 250px !important;
}

.agent-input-container {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 1500px;
  z-index: 100;
}

.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.clickable:hover {
  opacity: 0.8;
}


</style>
