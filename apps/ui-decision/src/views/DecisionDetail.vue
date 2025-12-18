<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import { useDecisionMutations } from '../composables/useDecisionMutations'

const route = useRoute()
const router = useRouter()
const decisionId = computed(() => route.params.id as string)

// Decision state
const decision = ref<DecisionDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const showNotification = ref(false)

// Use the mutations composable
const mutations = useDecisionMutations(decisionId.value, decision)

// Dialog state
const showOptionDialog = ref(false)
const showDriverDialog = ref(false)
const showComponentDialog = ref(false)
const showUseCaseDialog = ref(false)
const showConfirmDialog = ref(false)
const showEditConfluenceUrlDialog = ref(false)

const editingOption = ref<{ id: string; name: string; description: string; moreLink?: string } | null>(null)
const editingDriver = ref<{ id: string; name: string; description: string } | null>(null)
const editingComponent = ref<{ id: string; name: string; description: string } | null>(null)
const editingUseCase = ref<{ id: string; name: string; description: string } | null>(null)
const confirmDialogData = ref<{ title: string; message: string; onConfirm: () => void } | null>(null)

// Socket.IO setup
let unsubscribeUpdate: (() => void) | null = null

onMounted(() => {
  loading.value = true
  initSocket()

  unsubscribeUpdate = onDecisionUpdated(({ id: updatedId, decision: updatedDecision }) => {
    if (updatedId === decisionId.value) {
      decision.value = updatedDecision
      showNotification.value = true
    }
  })

  void (async () => {
    try {
      decision.value = await api.getDecision(decisionId.value)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 404) {
        error.value = 'Decision not found'
      } else {
        error.value = 'Failed to load decision. Make sure the backend is running on http://localhost:3000'
      }
      console.error(e)
    } finally {
      loading.value = false
    }
  })()
})

onUnmounted(() => {
  unsubscribeUpdate?.()
})

const goBack = () => void router.push('/')

// Confluence actions
const copyConfluenceUrl = async () => {
  if (decision.value?.confluenceLink) {
    try {
      await navigator.clipboard.writeText(decision.value.confluenceLink)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }
}

const openInConfluence = () => {
  if (decision.value?.confluenceLink) {
    window.open(decision.value.confluenceLink, '_blank')
  }
}

const pullFromConfluence = () => {
  alert('Pull from Confluence - Not implemented yet')
}

// Option dialog handlers
const openAddOptionDialog = () => {
  editingOption.value = null
  showOptionDialog.value = true
}

const openEditOptionDialog = (option: { id: string; name: string; description: string; moreLink?: string }) => {
  editingOption.value = option
  showOptionDialog.value = true
}

const handleSaveOption = async (data: { name: string; description: string; moreLink?: string }) => {
  if (editingOption.value) {
    await mutations.updateOption(editingOption.value.id, data)
  } else {
    await mutations.createOption(data)
  }
}

const confirmDeleteOption = (option: { id: string; name: string }) => {
  confirmDialogData.value = {
    title: 'Delete Option',
    message: `Are you sure you want to delete "${option.name}"? This will also remove all evaluations for this option.`,
    onConfirm: () => void mutations.deleteOption(option.id),
  }
  showConfirmDialog.value = true
}

// Driver dialog handlers
const openAddDriverDialog = () => {
  editingDriver.value = null
  showDriverDialog.value = true
}

const openEditDriverDialog = (driver: { id: string; name: string; description: string }) => {
  editingDriver.value = driver
  showDriverDialog.value = true
}

const handleSaveDriver = async (data: { name: string; description: string }) => {
  if (editingDriver.value) {
    await mutations.updateDriver(editingDriver.value.id, data)
  } else {
    await mutations.createDriver(data)
  }
}

const confirmDeleteDriver = (driver: { id: string; name: string }) => {
  confirmDialogData.value = {
    title: 'Delete Driver',
    message: `Are you sure you want to delete "${driver.name}"? This will also remove all evaluations for this driver.`,
    onConfirm: () => void mutations.deleteDriver(driver.id),
  }
  showConfirmDialog.value = true
}

// Component dialog handlers
const openAddComponentDialog = () => {
  editingComponent.value = null
  showComponentDialog.value = true
}

const openEditComponentDialog = (component: { id: string; name: string; description: string }) => {
  editingComponent.value = component
  showComponentDialog.value = true
}

const handleSaveComponent = async (data: { name: string; description: string }) => {
  if (editingComponent.value) {
    await mutations.updateComponent(editingComponent.value.id, data)
  } else {
    await mutations.createComponent(data)
  }
}

const confirmDeleteComponent = (component: { id: string; name: string }) => {
  confirmDialogData.value = {
    title: 'Delete Component',
    message: `Are you sure you want to delete "${component.name}"?`,
    onConfirm: () => void mutations.deleteComponent(component.id),
  }
  showConfirmDialog.value = true
}

// Use Case dialog handlers
const openAddUseCaseDialog = () => {
  editingUseCase.value = null
  showUseCaseDialog.value = true
}

const openEditUseCaseDialog = (useCase: { id: string; name: string; description: string }) => {
  editingUseCase.value = useCase
  showUseCaseDialog.value = true
}

const handleSaveUseCase = async (data: { name: string; description: string }) => {
  if (editingUseCase.value) {
    await mutations.updateUseCase(editingUseCase.value.id, data)
  } else {
    await mutations.createUseCase(data)
  }
}

const confirmDeleteUseCase = (useCase: { id: string; name: string }) => {
  confirmDialogData.value = {
    title: 'Delete Use Case',
    message: `Are you sure you want to delete "${useCase.name}"?`,
    onConfirm: () => void mutations.deleteUseCase(useCase.id),
  }
  showConfirmDialog.value = true
}

// Confirm dialog
const handleConfirmDialogConfirm = () => {
  confirmDialogData.value?.onConfirm()
}

// AI prompt helpers
const appendAIPromptForProblem = () => {
  mutations.appendToAgentPrompt('Edit the problem definition: ')
}

const appendAIPromptForProposalDesc = () => {
  mutations.appendToAgentPrompt('Edit the proposal description: ')
}

const appendAIPromptForProposalReasoning = () => {
  mutations.appendToAgentPrompt('Edit the proposal reasoning: ')
}

const appendAIPromptForComponent = (component: { name: string }) => {
  mutations.appendToAgentPrompt(`Edit the component "${component.name}": `)
}

const appendAIPromptForUseCase = (useCase: { name: string }) => {
  mutations.appendToAgentPrompt(`Edit the use case "${useCase.name}": `)
}

const handleEvaluationEditAi = (context: { type: string; optionName: string; driverName?: string }) => {
  if (context.type === 'evaluation' && context.driverName) {
    mutations.appendToAgentPrompt(`Edit the "${context.optionName}" - "${context.driverName}" evaluation: `)
  } else if (context.type === 'description') {
    mutations.appendToAgentPrompt(`Edit the description of "${context.optionName}": `)
  } else if (context.type === 'diagram') {
    mutations.appendToAgentPrompt(`Edit the architecture diagram of "${context.optionName}": `)
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
        @click="showEditConfluenceUrlDialog = true"
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
        :loading="mutations.pushingToConfluence.value"
        :disabled="!decision?.confluenceLink || mutations.pushingToConfluence.value"
        @click="mutations.pushToConfluence"
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
          @update="mutations.updateProblemDefinition"
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
          @update:description="mutations.updateProposalDescription"
          @update:reasoning="mutations.updateProposalReasoning"
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
        @select-option="mutations.setSelectedOption"
        @edit-driver="openEditDriverDialog"
        @delete-driver="confirmDeleteDriver"
        @update-rating="mutations.updateEvaluationRating"
        @update-evaluation-details="mutations.updateEvaluationDetails"
        @update-option-description="mutations.updateOptionDescription"
        @update-option-diagram="mutations.updateOptionDiagram"
        @edit-ai="handleEvaluationEditAi"
      />
    </template>

    <!-- AI Agent Input -->
    <div class="agent-input-container">
      <v-textarea
        v-model="mutations.agentPrompt.value"
        placeholder="Ask the AI to modify this decision..."
        variant="outlined"
        hide-details
        auto-grow
        rows="1"
        :loading="mutations.agentProcessing.value"
        :disabled="mutations.agentProcessing.value"
        @keyup.ctrl.enter="mutations.submitAgentPrompt"
        @keyup.meta.enter="mutations.submitAgentPrompt"
      >
        <template #append-inner>
          <v-btn
            icon="mdi-send"
            variant="text"
            :loading="mutations.agentProcessing.value"
            :disabled="!mutations.agentPrompt.value.trim() || mutations.agentProcessing.value"
            @click="mutations.submitAgentPrompt"
          />
        </template>
      </v-textarea>
    </div>

    <!-- Notifications -->
    <v-snackbar v-model="showNotification" :timeout="3000" color="success" location="top">
      <v-icon start>mdi-refresh</v-icon>
      Decision updated in real-time
    </v-snackbar>

    <v-snackbar
      v-model="mutations.notification.value.show"
      :timeout="5000"
      :color="mutations.notification.value.type"
      location="bottom"
    >
      <v-icon start>
        {{ mutations.notification.value.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
      </v-icon>
      {{ mutations.notification.value.message }}
    </v-snackbar>

    <!-- Dialogs -->
    <OptionDialog
      v-model="showOptionDialog"
      :edit-option="editingOption"
      @save="handleSaveOption"
    />

    <NameDescriptionDialog
      v-model="showDriverDialog"
      entity-name="Decision Driver"
      :edit-item="editingDriver"
      :description-max-length="500"
      @save="handleSaveDriver"
    />

    <NameDescriptionDialog
      v-model="showComponentDialog"
      entity-name="Component"
      :edit-item="editingComponent"
      @save="handleSaveComponent"
    />

    <NameDescriptionDialog
      v-model="showUseCaseDialog"
      entity-name="Use Case"
      :edit-item="editingUseCase"
      @save="handleSaveUseCase"
    />

    <ConfirmDialog
      v-if="confirmDialogData"
      v-model="showConfirmDialog"
      :title="confirmDialogData.title"
      :message="confirmDialogData.message"
      @confirm="handleConfirmDialogConfirm"
    />

    <TextEditDialog
      v-model="showEditConfluenceUrlDialog"
      title="Edit Confluence URL"
      label="Confluence URL"
      :value="decision?.confluenceLink ?? ''"
      :multiline="false"
      placeholder="https://..."
      hint="Leave empty to remove the Confluence link"
      :required="false"
      @save="mutations.updateConfluenceUrl"
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
