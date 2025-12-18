<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EntityDetailPage, TextEditDialog } from '@magik/ui-shared'
import { api, type DecisionDetail } from '../services/api'
import { initSocket, onDecisionUpdated } from '../services/socket'
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
const showEditConfluenceUrlDialog = ref(false)

// Mutations composable for API calls
const mutations = useDecisionMutations(decisionId.value, decision)

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
          @create="mutations.createComponent"
          @update="mutations.updateComponent"
          @delete="mutations.deleteComponent"
          @edit-ai="appendAIPromptForComponent"
        />

        <UseCasesSection
          :use-cases="decision.useCases ?? []"
          @create="mutations.createUseCase"
          @update="mutations.updateUseCase"
          @delete="mutations.deleteUseCase"
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
        @create-option="mutations.createOption"
        @update-option="mutations.updateOption"
        @delete-option="mutations.deleteOption"
        @select-option="mutations.setSelectedOption"
        @update-option-description="mutations.updateOptionDescription"
        @update-option-diagram="mutations.updateOptionDiagram"
        @create-driver="mutations.createDriver"
        @update-driver="mutations.updateDriver"
        @delete-driver="mutations.deleteDriver"
        @update-rating="mutations.updateEvaluationRating"
        @update-evaluation-details="mutations.updateEvaluationDetails"
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

    <!-- Confluence URL Dialog -->
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
