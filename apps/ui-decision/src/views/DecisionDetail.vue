<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EntityDetailPage, ListBox } from '@magik/ui-shared'
import { api, type DecisionDetail } from '../services/api'
import { VueMermaidRender } from 'vue-mermaid-render'
import { initSocket, onDecisionUpdated } from '../services/socket'
import RatingDialog from '../components/RatingDialog.vue'
import OptionDialog from '../components/OptionDialog.vue'
import DriverDialog from '../components/DriverDialog.vue'
import ComponentDialog from '../components/ComponentDialog.vue'
import UseCaseDialog from '../components/UseCaseDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import EditDescriptionDialog from '../components/EditDescriptionDialog.vue'
import EditEvaluationDetailDialog from '../components/EditEvaluationDetailDialog.vue'

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

// Rating dialog state
const showRatingDialog = ref(false)
const ratingDialogData = ref<{
  optionId: string
  optionName: string
  driverId: string
  driverName: string
  currentRating: 'high' | 'medium' | 'low'
} | null>(null)

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

const getEvaluation = (optionId: string, driverId: string) => {
  return decision.value?.evaluationMatrix.find(
    (e) => e.optionId === optionId && e.driverId === driverId
  )
}

const _getRatingColor = (rating?: 'high' | 'medium' | 'low') => {
  switch (rating) {
    case 'high':
      return 'success'
    case 'medium':
      return 'warning'
    case 'low':
      return 'error'
    default:
      return 'grey'
  }
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

const hasAnyDiagram = computed(() => {
  return decision.value?.options.some(
    (option) => option.architectureDiagramMermaid ?? option.architectureDiagramLink
  )
})

const selectedOptionName = computed(() => {
  if (!decision.value?.selectedOption) return null
  const option = decision.value.options.find((opt) => opt.id === decision.value.selectedOption)
  return option?.name ?? decision.value.selectedOption
})

const _firstColumnWidthPercent = computed(() => {
  if (!decision.value?.options.length) return '15%'
  // First column: 15%, rest divided equally
  // With pure percentages: first gets 15%, rest split the 85%
  return '15%'
})

const optionColumnWidth = computed(() => {
  if (!decision.value?.options.length) return '0%'
  // Remaining 85% divided equally among options
  const percentPerColumn = 85 / decision.value.options.length
  return `${percentPerColumn}% !important`
})

// Rating dialog handlers
const openRatingDialog = (
  optionId: string,
  optionName: string,
  driverId: string,
  driverName: string,
  currentRating: 'high' | 'medium' | 'low'
) => {
  ratingDialogData.value = { optionId, optionName, driverId, driverName, currentRating }
  showRatingDialog.value = true
}

const handleRatingSave = async (newRating: 'high' | 'medium' | 'low') => {
  if (!ratingDialogData.value) return

  try {
    const decisionId = route.params.id as string
    await api.updateEvaluationRating(
      decisionId,
      ratingDialogData.value.optionId,
      ratingDialogData.value.driverId,
      newRating
    )
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update rating',
      type: 'error',
    }
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

// Edit description dialog state
const showEditDescriptionDialog = ref(false)
const editDescriptionData = ref<{
  optionId: string
  optionName: string
  description: string
} | null>(null)

// Edit evaluation detail dialog state
const showEditEvaluationDetailDialog = ref(false)
const editEvaluationDetailData = ref<{
  optionId: string
  optionName: string
  driverId: string
  driverName: string
  details: string[]
} | null>(null)

// Description edit handlers
const openEditDescriptionDialog = (option: { id: string; name: string; description: string }) => {
  editDescriptionData.value = {
    optionId: option.id,
    optionName: option.name,
    description: option.description,
  }
  showEditDescriptionDialog.value = true
}

const handleSaveDescription = async (newDescription: string) => {
  if (!editDescriptionData.value) return
  const option = decision.value?.options.find((o) => o.id === editDescriptionData.value!.optionId)
  if (!option) return

  try {
    const decisionId = route.params.id as string
    await api.updateOption(decisionId, editDescriptionData.value.optionId, {
      name: option.name,
      description: newDescription,
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

const appendAIPromptForDescription = (option: { id: string; name: string }) => {
  const prompt = `Edit the description of "${option.name}": `
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

// Evaluation detail edit handlers
const openEditEvaluationDetailDialog = (
  option: { id: string; name: string },
  driver: { id: string; name: string },
  details: string[]
) => {
  editEvaluationDetailData.value = {
    optionId: option.id,
    optionName: option.name,
    driverId: driver.id,
    driverName: driver.name,
    details,
  }
  showEditEvaluationDetailDialog.value = true
}

const handleSaveEvaluationDetail = async (newDetails: string[]) => {
  if (!editEvaluationDetailData.value) return
  const { optionId, driverId } = editEvaluationDetailData.value

  try {
    const decisionId = route.params.id as string
    await api.updateEvaluationDetails(decisionId, optionId, driverId, newDetails)
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update evaluation details',
      type: 'error',
    }
  }
}

const appendAIPromptForEvaluationDetail = (
  option: { id: string; name: string },
  driver: { id: string; name: string }
) => {
  const prompt = `Edit the "${option.name}" - "${driver.name}" evaluation: `
  agentPrompt.value = agentPrompt.value ? `${agentPrompt.value}\n\n${prompt}` : prompt
}

// Problem Definition edit dialog state
const showEditProblemDialog = ref(false)
const editedProblemDefinition = ref('')

// Proposal description edit dialog state
const showEditProposalDescDialog = ref(false)
const editedProposalDescription = ref('')

// Proposal reasoning edit dialog state
const showEditProposalReasoningDialog = ref(false)
const editedProposalReasoning = ref<string[]>([])

const openEditProblemDialog = () => {
  editedProblemDefinition.value = decision.value?.problemDefinition ?? ''
  showEditProblemDialog.value = true
}

const handleSaveProblemDefinition = async () => {
  try {
    const decisionId = route.params.id as string
    await api.updateDecision(decisionId, {
      problemDefinition: editedProblemDefinition.value.trim(),
    })
    showEditProblemDialog.value = false
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update problem definition',
      type: 'error',
    }
  }
}

const openEditProposalDescDialog = () => {
  editedProposalDescription.value = decision.value?.proposal.description ?? ''
  showEditProposalDescDialog.value = true
}

const handleSaveProposalDesc = async () => {
  try {
    const decisionId = route.params.id as string
    await api.updateDecision(decisionId, {
      proposal: {
        description: editedProposalDescription.value.trim(),
        reasoning: decision.value?.proposal.reasoning ?? [],
      },
    })
    showEditProposalDescDialog.value = false
  } catch (err: unknown) {
    agentNotification.value = {
      show: true,
      message: (err as Error).message ?? 'Failed to update proposal',
      type: 'error',
    }
  }
}

const openEditProposalReasoningDialog = () => {
  editedProposalReasoning.value = [...(decision.value?.proposal.reasoning ?? [])]
  showEditProposalReasoningDialog.value = true
}

const handleSaveProposalReasoning = async (newReasoning: string[]) => {
  try {
    const decisionId = route.params.id as string
    await api.updateDecision(decisionId, {
      proposal: {
        description: decision.value?.proposal.description ?? '',
        reasoning: newReasoning,
      },
    })
    showEditProposalReasoningDialog.value = false
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
const editedConfluenceUrl = ref('')

const openEditConfluenceUrlDialog = () => {
  editedConfluenceUrl.value = decision.value?.confluenceLink ?? ''
  showEditConfluenceUrlDialog.value = true
}

const handleSaveConfluenceUrl = async () => {
  try {
    const decisionId = route.params.id as string
    await api.updateDecision(decisionId, { confluenceLink: editedConfluenceUrl.value.trim() })
    showEditConfluenceUrlDialog.value = false
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
          <!-- Problem Definition -->
          <v-card class="mb-4">
            <v-card-title>
              <v-menu>
                <template #activator="{ props }">
                  <span
                    v-bind="props"
                    class="clickable-header"
                    @dblclick.stop="openEditProblemDialog"
                  >Problem Definition</span>
                </template>
                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-pencil"
                    title="Edit"
                    @click="openEditProblemDialog"
                  />
                  <v-list-item
                    prepend-icon="mdi-robot"
                    title="Edit with AI"
                    @click="appendAIPromptForProblem"
                  />
                </v-list>
              </v-menu>
            </v-card-title>
            <v-card-text>
              <span :class="{ 'empty-placeholder': !decision.problemDefinition }">
                {{ decision.problemDefinition || 'Click header to add problem definition...' }}
              </span>
            </v-card-text>
          </v-card>

          <!-- Components -->
          <ListBox
            title="Components"
            class="mb-4"
            empty-text="No components yet. Click + to add one."
            @add="openAddComponentDialog"
          >
            <template v-if="decision.components && decision.components.length > 0">
              <v-card
                v-for="component in decision.components"
                :key="component.id"
                variant="outlined"
                class="mb-2"
              >
                <v-card-title class="text-subtitle-1 d-flex align-center">
                  <v-menu>
                    <template #activator="{ props }">
                      <span
                        v-bind="props"
                        class="clickable-header"
                        @dblclick.stop="openEditComponentDialog(component)"
                      >{{ component.name }}</span>
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        title="Edit"
                        @click="openEditComponentDialog(component)"
                      />
                      <v-list-item
                        prepend-icon="mdi-robot"
                        title="Edit with AI"
                        @click="appendAIPromptForComponent(component)"
                      />
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Delete"
                        @click="confirmDeleteComponent(component)"
                      />
                    </v-list>
                  </v-menu>
                </v-card-title>
                <v-card-text>{{ component.description }}</v-card-text>
              </v-card>
            </template>
          </ListBox>

          <!-- Use Cases -->
          <ListBox
            title="Use Cases"
            class="mb-4"
            empty-text="No use cases yet. Click + to add one."
            @add="openAddUseCaseDialog"
          >
            <template v-if="decision.useCases && decision.useCases.length > 0">
              <v-card
                v-for="useCase in decision.useCases"
                :key="useCase.id"
                variant="outlined"
                class="mb-2"
              >
                <v-card-title class="text-subtitle-1 d-flex align-center">
                  <v-menu>
                    <template #activator="{ props }">
                      <span
                        v-bind="props"
                        class="clickable-header"
                        @dblclick.stop="openEditUseCaseDialog(useCase)"
                      >{{ useCase.name }}</span>
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        title="Edit"
                        @click="openEditUseCaseDialog(useCase)"
                      />
                      <v-list-item
                        prepend-icon="mdi-robot"
                        title="Edit with AI"
                        @click="appendAIPromptForUseCase(useCase)"
                      />
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Delete"
                        @click="confirmDeleteUseCase(useCase)"
                      />
                    </v-list>
                  </v-menu>
                </v-card-title>
                <v-card-text>{{ useCase.description }}</v-card-text>
              </v-card>
            </template>
          </ListBox>

          <!-- Proposal -->
          <v-card>
            <v-card-title>
              <v-menu>
                <template #activator="{ props }">
                  <span
                    v-bind="props"
                    class="clickable-header"
                    @dblclick.stop="openEditProposalDescDialog"
                  >Proposal</span>
                </template>
                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-pencil"
                    title="Edit"
                    @click="openEditProposalDescDialog"
                  />
                  <v-list-item
                    prepend-icon="mdi-robot"
                    title="Edit with AI"
                    @click="appendAIPromptForProposalDesc"
                  />
                </v-list>
              </v-menu>
            </v-card-title>
            <v-card-text>
              <p class="mb-4" :class="{ 'empty-placeholder': !decision.proposal.description }">
                {{ decision.proposal.description || 'Click header to add proposal description...' }}
              </p>

              <v-divider class="my-4" />

              <v-menu>
                <template #activator="{ props }">
                  <p
                    v-bind="props"
                    class="font-weight-bold mb-2 clickable-header"
                    @dblclick.stop="openEditProposalReasoningDialog"
                  >
                    Reasoning:
                  </p>
                </template>
                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-pencil"
                    title="Edit"
                    @click="openEditProposalReasoningDialog"
                  />
                  <v-list-item
                    prepend-icon="mdi-robot"
                    title="Edit with AI"
                    @click="appendAIPromptForProposalReasoning"
                  />
                </v-list>
              </v-menu>
              <ul v-if="decision.proposal.reasoning.length > 0" class="reasoning-list">
                <li v-for="(reason, index) in decision.proposal.reasoning" :key="index">
                  {{ reason }}
                </li>
              </ul>
              <p v-else class="empty-placeholder">
                Click Reasoning to add...
              </p>

              <v-divider class="my-4" />

              <v-chip
                v-if="decision.selectedOption"
                color="success"
                variant="tonal"
                class="mt-2"
              >
                <v-icon start>
                  mdi-check-circle
                </v-icon>
                Selected: {{ selectedOptionName }}
              </v-chip>
            </v-card-text>
          </v-card>
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
      <v-card>
            <v-card-title class="d-flex align-center">
              <span>Evaluation Matrix</span>
              <v-spacer />
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                class="mr-2"
                @click="openAddOptionDialog"
              >
                Add Option
              </v-btn>
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                @click="openAddDriverDialog"
              >
                Add Driver
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-table style="min-width: 100%">
                <thead>
                  <tr>
                    <th class="text-left" />
                    <th
                      v-for="option in decision.options"
                      :key="option.id"
                      class="text-left"
                      :style="{ width: optionColumnWidth }"
                    >
                      <v-menu>
                        <template #activator="{ props }">
                          <span
                            v-bind="props"
                            class="option-name"
                            :class="{ 'font-weight-bold': decision.selectedOption === option.id }"
                            @dblclick.stop="openEditOptionDialog(option)"
                          >
                            {{ option.name }}
                          </span>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            v-if="decision.selectedOption === option.id"
                            prepend-icon="mdi-close-circle-outline"
                            title="Clear selection"
                            @click="handleSetSelectedOption(null)"
                          />
                          <v-list-item
                            v-else
                            prepend-icon="mdi-check-circle-outline"
                            title="Select"
                            @click="handleSetSelectedOption(option.id)"
                          />
                          <v-list-item
                            prepend-icon="mdi-pencil"
                            title="Edit"
                            @click="openEditOptionDialog(option)"
                          />
                          <v-list-item
                            prepend-icon="mdi-delete"
                            title="Remove"
                            class="text-error"
                            @click="confirmDeleteOption(option)"
                          />
                        </v-list>
                      </v-menu>
                      <v-chip
                        v-if="decision.selectedOption === option.id"
                        color="success"
                        variant="tonal"
                        class="ml-2"
                      >
                        <v-icon start>
                          mdi-check-circle
                        </v-icon>
                        Selected
                      </v-chip>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Description Row -->
                  <tr>
                    <th class="font-weight-bold">
                      Description
                    </th>
                    <td
                      v-for="option in decision.options"
                      :key="option.id"
                      :style="{ width: optionColumnWidth }"
                    >
                      <v-menu>
                        <template #activator="{ props }">
                          <span
                            v-bind="props"
                            class="editable-text"
                            :class="{ 'empty-placeholder': !option.description }"
                            @dblclick.stop="openEditDescriptionDialog(option)"
                          >
                            {{ option.description || 'Click to add description...' }}
                          </span>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            prepend-icon="mdi-pencil"
                            title="Edit"
                            @click="openEditDescriptionDialog(option)"
                          />
                          <v-list-item
                            prepend-icon="mdi-robot"
                            title="Edit with AI"
                            @click="appendAIPromptForDescription(option)"
                          />
                        </v-list>
                      </v-menu>
                    </td>
                  </tr>

                  <!-- Architecture Diagram Row -->
                  <tr v-if="hasAnyDiagram">
                    <th class="font-weight-bold">
                      Architecture Diagram
                    </th>
                    <td
                      v-for="option in decision.options"
                      :key="`diagram-${option.id}`"
                      :style="{ width: optionColumnWidth }"
                    >
                      <div v-if="option.architectureDiagramMermaid" class="diagram-container">
                        <VueMermaidRender :content="option.architectureDiagramMermaid" />
                      </div>
                      <span v-else class="text-grey">-</span>
                    </td>
                  </tr>

                  <!-- Evaluation Rows -->
                  <tr v-for="driver in decision.decisionDrivers" :key="driver.id">
                    <td class="font-weight-bold">
                      <v-menu>
                        <template #activator="{ props: menuProps }">
                          <v-tooltip location="right">
                            <template #activator="{ props: tooltipProps }">
                              <span
                                v-bind="{ ...menuProps, ...tooltipProps }"
                                class="driver-name"
                                @dblclick.stop="openEditDriverDialog(driver)"
                              >
                                {{ driver.name }}
                              </span>
                            </template>
                            <div class="tooltip-content">
                              {{ driver.description }}
                            </div>
                          </v-tooltip>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            prepend-icon="mdi-pencil"
                            title="Edit"
                            @click="openEditDriverDialog(driver)"
                          />
                          <v-list-item
                            prepend-icon="mdi-delete"
                            title="Remove"
                            class="text-error"
                            @click="confirmDeleteDriver(driver)"
                          />
                        </v-list>
                      </v-menu>
                    </td>
                    <td
                      v-for="option in decision.options"
                      :key="option.id"
                      class="evaluation-cell"
                      :style="{ width: optionColumnWidth }"
                    >
                      <div v-if="getEvaluation(option.id, driver.id)" class="evaluation-content">
                        <div
                          class="rating-indicator"
                          :class="`rating-${getEvaluation(option.id, driver.id)?.rating}`"
                          @click="
                            openRatingDialog(
                              option.id,
                              option.name,
                              driver.id,
                              driver.name,
                              getEvaluation(option.id, driver.id)!.rating
                            )
                          "
                        />
                        <v-menu>
                          <template #activator="{ props }">
                            <div
                              v-bind="props"
                              class="evaluation-details editable-text"
                              @dblclick.stop="
                                openEditEvaluationDetailDialog(
                                  option,
                                  driver,
                                  getEvaluation(option.id, driver.id)?.evaluationDetails || []
                                )
                              "
                            >
                              <ul
                                v-if="
                                  getEvaluation(option.id, driver.id)?.evaluationDetails?.length
                                "
                                class="evaluation-list"
                              >
                                <li
                                  v-for="(detail, idx) in getEvaluation(option.id, driver.id)
                                    ?.evaluationDetails"
                                  :key="idx"
                                >
                                  {{ detail }}
                                </li>
                              </ul>
                              <span
                                v-else
                                class="empty-placeholder"
                              >Click to add evaluation...</span>
                            </div>
                          </template>
                          <v-list density="compact">
                            <v-list-item
                              prepend-icon="mdi-pencil"
                              title="Edit"
                              @click="
                                openEditEvaluationDetailDialog(
                                  option,
                                  driver,
                                  getEvaluation(option.id, driver.id)?.evaluationDetails || []
                                )
                              "
                            />
                            <v-list-item
                              prepend-icon="mdi-robot"
                              title="Edit with AI"
                              @click="appendAIPromptForEvaluationDetail(option, driver)"
                            />
                          </v-list>
                        </v-menu>
                      </div>
                      <span v-else class="text-grey">N/A</span>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <!-- Rating Legend -->
              <div class="rating-legend mt-4">
                <div class="legend-item">
                  <span class="legend-dot success" />
                  <span class="legend-text">Green - Meets requirements well / Good fit / Low risk</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot warning" />
                  <span class="legend-text">Yellow - Partially meets requirements / Acceptable with trade-offs / Medium
                    risk</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot error" />
                  <span class="legend-text">Red - Does not meet requirements / Significant concerns / High risk</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
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

    <!-- Rating Dialog -->
    <RatingDialog
      v-if="ratingDialogData"
      v-model="showRatingDialog"
      :option-name="ratingDialogData.optionName"
      :driver-name="ratingDialogData.driverName"
      :current-rating="ratingDialogData.currentRating"
      @save="handleRatingSave"
    />

    <!-- Option Dialog -->
    <OptionDialog
      v-model="showOptionDialog"
      :edit-option="editingOption"
      @save="handleSaveOption"
    />

    <!-- Driver Dialog -->
    <DriverDialog
      v-model="showDriverDialog"
      :edit-driver="editingDriver"
      @save="handleSaveDriver"
    />

    <!-- Component Dialog -->
    <ComponentDialog
      v-model="showComponentDialog"
      :edit-component="editingComponent"
      @save="handleSaveComponent"
    />

    <!-- Use Case Dialog -->
    <UseCaseDialog
      v-model="showUseCaseDialog"
      :edit-use-case="editingUseCase"
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

    <!-- Edit Description Dialog -->
    <EditDescriptionDialog
      v-if="editDescriptionData"
      v-model="showEditDescriptionDialog"
      :option-name="editDescriptionData.optionName"
      :description="editDescriptionData.description"
      @save="handleSaveDescription"
    />

    <!-- Edit Evaluation Detail Dialog -->
    <EditEvaluationDetailDialog
      v-if="editEvaluationDetailData"
      v-model="showEditEvaluationDetailDialog"
      :option-name="editEvaluationDetailData.optionName"
      :driver-name="editEvaluationDetailData.driverName"
      :details="editEvaluationDetailData.details"
      @save="handleSaveEvaluationDetail"
    />

    <!-- Edit Problem Definition Dialog -->
    <v-dialog v-model="showEditProblemDialog" max-width="600">
      <v-card>
        <v-card-title>Edit Problem Definition</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editedProblemDefinition"
            label="Problem Definition"
            variant="outlined"
            rows="6"
            auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEditProblemDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="handleSaveProblemDefinition">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Proposal Description Dialog -->
    <v-dialog v-model="showEditProposalDescDialog" max-width="600">
      <v-card>
        <v-card-title>Edit Proposal</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editedProposalDescription"
            label="Proposal Description"
            variant="outlined"
            rows="6"
            auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEditProposalDescDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="handleSaveProposalDesc">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Proposal Reasoning Dialog -->
    <EditEvaluationDetailDialog
      v-model="showEditProposalReasoningDialog"
      option-name="Proposal"
      driver-name="Reasoning"
      :details="editedProposalReasoning"
      @save="handleSaveProposalReasoning"
    />

    <!-- Edit Confluence URL Dialog -->
    <v-dialog v-model="showEditConfluenceUrlDialog" max-width="600">
      <v-card>
        <v-card-title>Edit Confluence URL</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editedConfluenceUrl"
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
          <v-btn color="primary" variant="flat" @click="handleSaveConfluenceUrl">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

.evaluation-list {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0;
}

.evaluation-list li {
  margin-bottom: 4px;
  font-size: 0.9em;
}

.reasoning-list {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0;
}

.reasoning-list li {
  margin-bottom: 8px;
  line-height: 1.4;
}

:deep(tbody td) {
  vertical-align: top;
  padding: 12px !important;
  font-size: 1rem;
}

:deep(tbody td:first-child),
:deep(tbody th:first-child) {
  background-color: rgba(var(--v-theme-primary), 0.1);
  font-weight: bold;
  font-size: 1rem;
}

:deep(thead th) {
  background-color: rgba(var(--v-theme-primary), 0.1);
  font-weight: bold;
  padding: 12px !important;
  font-size: 1rem;
}

.driver-name {
  cursor: pointer;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}

.option-name {
  cursor: pointer;
}

.option-name:hover,
.driver-name:hover {
  text-decoration: underline;
}

.tooltip-content {
  max-width: 300px;
}

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

/* Evaluation cell layout */
.evaluation-cell {
  padding: 0 !important;
  overflow: hidden;
}

.evaluation-content {
  display: flex;
  min-height: 60px;
  overflow: hidden;
}

.rating-indicator {
  width: 12px;
  min-width: 12px;
  cursor: pointer;
  transition: width 0.15s ease;
}

.rating-indicator:hover {
  width: 20px;
}

.rating-indicator.rating-high {
  background-color: rgb(var(--v-theme-success));
}

.rating-indicator.rating-medium {
  background-color: rgb(var(--v-theme-warning));
}

.rating-indicator.rating-low {
  background-color: rgb(var(--v-theme-error));
}

.evaluation-details {
  padding: 12px;
  flex: 1;
  min-width: 0;
}

.evaluation-details.editable-text {
  margin: 0;
}

/* Rating Legend */
.rating-legend {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.success {
  background-color: rgb(var(--v-theme-success));
}

.legend-dot.warning {
  background-color: rgb(var(--v-theme-warning));
}

.legend-dot.error {
  background-color: rgb(var(--v-theme-error));
}

.legend-text {
  font-size: 0.875rem;
  color: white;
}

/* Editable text (clickable for menu) */
.editable-text {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
  transition: background-color 0.15s ease;
}

.editable-text:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.empty-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.clickable-header {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 6px;
  margin: -2px -6px;
  transition: background-color 0.15s ease;
}

.clickable-header:hover {
  background-color: rgba(var(--v-theme-primary), 0.15);
}

</style>
