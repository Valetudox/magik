<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { EntityDetailPage, TextEditDialog, type DetailPageConfig } from '@magik/ui-shared'
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
const decisionId = computed(() => route.params.id as string)

// Decision state - updated via onLoad callback
const decision = ref<DecisionDetail | null>(null)
const decisionVersion = ref(0)

// Reference to EntityDetailPage for agent prompt
const detailPageRef = ref<InstanceType<typeof EntityDetailPage> | null>(null)

// Dialog state
const showEditConfluenceUrlDialog = ref(false)

// Mutations composable for API calls
const mutations = useDecisionMutations(decisionId.value, decision)

// Page config
const config = computed<DetailPageConfig>(() => ({
  pageTitle: 'Decision Documents',
  goBackUrl: '/',
  entityId: decisionId.value,
  getEntity: (id: string) => api.getDecision(id),
  getSubtitle: (d: DecisionDetail) => d.id.replace(/-/g, ' '),
  onLoad: (entity: DecisionDetail) => {
    decision.value = entity
    decisionVersion.value++
  },
  socket: {
    enabled: true,
    initSocket,
    onUpdated: onDecisionUpdated,
  },
  agent: {
    enabled: true,
    placeholder: 'Ask the AI to modify this decision...',
    onSubmit: (prompt: string) => api.askAgent(decisionId.value, prompt),
  },
}))

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
  detailPageRef.value?.appendToAgentPrompt('Edit the problem definition: ')
}

const appendAIPromptForProposalDesc = () => {
  detailPageRef.value?.appendToAgentPrompt('Edit the proposal description: ')
}

const appendAIPromptForProposalReasoning = () => {
  detailPageRef.value?.appendToAgentPrompt('Edit the proposal reasoning: ')
}

const appendAIPromptForComponent = (component: { name: string }) => {
  detailPageRef.value?.appendToAgentPrompt(`Edit the component "${component.name}": `)
}

const appendAIPromptForUseCase = (useCase: { name: string }) => {
  detailPageRef.value?.appendToAgentPrompt(`Edit the use case "${useCase.name}": `)
}

const handleEvaluationEditAi = (context: { type: string; optionName: string; driverName?: string }) => {
  if (context.type === 'evaluation' && context.driverName) {
    detailPageRef.value?.appendToAgentPrompt(`Edit the "${context.optionName}" - "${context.driverName}" evaluation: `)
  } else if (context.type === 'description') {
    detailPageRef.value?.appendToAgentPrompt(`Edit the description of "${context.optionName}": `)
  } else if (context.type === 'diagram') {
    detailPageRef.value?.appendToAgentPrompt(`Edit the architecture diagram of "${context.optionName}": `)
  }
}
</script>

<template>
  <EntityDetailPage
    ref="detailPageRef"
    :config="config"
  >
    <template #title-actions>
      <div class="d-flex ga-2">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-pencil"
          size="small"
          @click="showEditConfluenceUrlDialog = true"
        >
          Edit URL
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-content-copy"
          size="small"
          :disabled="!decision?.confluenceLink"
          @click="copyConfluenceUrl"
        >
          Copy
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-open-in-new"
          size="small"
          :disabled="!decision?.confluenceLink"
          @click="openInConfluence"
        >
          Open
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-upload"
          size="small"
          :loading="mutations.pushingToConfluence.value"
          :disabled="!decision?.confluenceLink || mutations.pushingToConfluence.value"
          @click="mutations.pushToConfluence"
        >
          Push
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-download"
          size="small"
          @click="pullFromConfluence"
        >
          Pull
        </v-btn>
      </div>
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
    <template v-if="decision">
      <EvaluationMatrix
        :key="decisionVersion"
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

    <!-- Notifications -->
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
</style>
