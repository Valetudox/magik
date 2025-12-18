import { ref, type Ref } from 'vue'
import { api, type DecisionDetail } from '../services/api'

export interface Notification {
  show: boolean
  message: string
  type: 'success' | 'error'
}

export function useDecisionMutations(
  decisionId: string,
  decision: Ref<DecisionDetail | null>
) {
  // Shared notification state
  const notification = ref<Notification>({
    show: false,
    message: '',
    type: 'success',
  })

  function showError(err: unknown, fallbackMessage: string) {
    notification.value = {
      show: true,
      message: err instanceof Error ? err.message : fallbackMessage,
      type: 'error',
    }
  }

  function showSuccess(message: string) {
    notification.value = {
      show: true,
      message,
      type: 'success',
    }
  }

  // Problem Definition
  async function updateProblemDefinition(value: string) {
    try {
      await api.updateDecision(decisionId, { problemDefinition: value })
    } catch (err) {
      showError(err, 'Failed to update problem definition')
    }
  }

  // Proposal
  async function updateProposalDescription(value: string) {
    try {
      await api.updateDecision(decisionId, {
        proposal: {
          description: value,
          reasoning: decision.value?.proposal.reasoning ?? [],
        },
      })
    } catch (err) {
      showError(err, 'Failed to update proposal')
    }
  }

  async function updateProposalReasoning(value: string[]) {
    try {
      await api.updateDecision(decisionId, {
        proposal: {
          description: decision.value?.proposal.description ?? '',
          reasoning: value,
        },
      })
    } catch (err) {
      showError(err, 'Failed to update reasoning')
    }
  }

  // Components
  async function createComponent(data: { name: string; description: string }) {
    try {
      await api.createComponent(decisionId, data)
    } catch (err) {
      showError(err, 'Failed to create component')
    }
  }

  async function updateComponent(id: string, data: { name: string; description: string }) {
    try {
      await api.updateComponent(decisionId, id, data)
    } catch (err) {
      showError(err, 'Failed to update component')
    }
  }

  async function deleteComponent(id: string) {
    try {
      await api.deleteComponent(decisionId, id)
    } catch (err) {
      showError(err, 'Failed to delete component')
    }
  }

  // Use Cases
  async function createUseCase(data: { name: string; description: string }) {
    try {
      await api.createUseCase(decisionId, data)
    } catch (err) {
      showError(err, 'Failed to create use case')
    }
  }

  async function updateUseCase(id: string, data: { name: string; description: string }) {
    try {
      await api.updateUseCase(decisionId, id, data)
    } catch (err) {
      showError(err, 'Failed to update use case')
    }
  }

  async function deleteUseCase(id: string) {
    try {
      await api.deleteUseCase(decisionId, id)
    } catch (err) {
      showError(err, 'Failed to delete use case')
    }
  }

  // Options
  async function createOption(data: { name: string; description: string; moreLink?: string }) {
    try {
      await api.createOption(decisionId, data)
    } catch (err) {
      showError(err, 'Failed to create option')
    }
  }

  async function updateOption(id: string, data: { name: string; description: string; moreLink?: string }) {
    try {
      await api.updateOption(decisionId, id, data)
    } catch (err) {
      showError(err, 'Failed to update option')
    }
  }

  async function deleteOption(id: string) {
    try {
      await api.deleteOption(decisionId, id)
    } catch (err) {
      showError(err, 'Failed to delete option')
    }
  }

  async function setSelectedOption(optionId: string | null) {
    try {
      await api.setSelectedOption(decisionId, optionId)
    } catch (err) {
      showError(err, 'Failed to update selection')
    }
  }

  async function updateOptionDescription(optionId: string, description: string) {
    const option = decision.value?.options.find((o) => o.id === optionId)
    if (!option) {
      return
    }

    try {
      await api.updateOption(decisionId, optionId, {
        name: option.name,
        description,
        moreLink: option.moreLink,
      })
    } catch (err) {
      showError(err, 'Failed to update description')
    }
  }

  function updateOptionDiagram(_optionId: string, _diagram: string) {
    // TODO: Add API method to update architecture diagram
    showError(new Error('Not implemented'), 'Diagram update not yet implemented')
  }

  // Drivers
  async function createDriver(data: { name: string; description: string }) {
    try {
      await api.createDriver(decisionId, data)
    } catch (err) {
      showError(err, 'Failed to create driver')
    }
  }

  async function updateDriver(id: string, data: { name: string; description: string }) {
    try {
      await api.updateDriver(decisionId, id, data)
    } catch (err) {
      showError(err, 'Failed to update driver')
    }
  }

  async function deleteDriver(id: string) {
    try {
      await api.deleteDriver(decisionId, id)
    } catch (err) {
      showError(err, 'Failed to delete driver')
    }
  }

  // Evaluations
  async function updateEvaluationRating(
    optionId: string,
    driverId: string,
    rating: 'high' | 'medium' | 'low' | null
  ) {
    try {
      // API expects rating without null, but we handle null as clearing the rating
      await api.updateEvaluationRating(decisionId, optionId, driverId, rating!)
    } catch (err) {
      showError(err, 'Failed to update rating')
    }
  }

  async function updateEvaluationDetails(
    optionId: string,
    driverId: string,
    details: string[]
  ) {
    try {
      await api.updateEvaluationDetails(decisionId, optionId, driverId, details)
    } catch (err) {
      showError(err, 'Failed to update evaluation details')
    }
  }

  // Confluence
  async function updateConfluenceUrl(value: string) {
    try {
      await api.updateDecision(decisionId, { confluenceLink: value })
    } catch (err) {
      showError(err, 'Failed to update Confluence URL')
    }
  }

  const pushingToConfluence = ref(false)

  async function pushToConfluence() {
    if (!decision.value?.confluenceLink) {
      showError(new Error('No link'), 'No Confluence link found for this decision')
      return
    }

    pushingToConfluence.value = true

    try {
      await api.pushToConfluence(decisionId, decision.value.confluenceLink)
      showSuccess('Successfully pushed to Confluence!')
    } catch (err) {
      showError(err, 'Failed to push to Confluence')
    } finally {
      pushingToConfluence.value = false
    }
  }

  return {
    // Notification
    notification,
    showError,
    showSuccess,

    // Problem Definition
    updateProblemDefinition,

    // Proposal
    updateProposalDescription,
    updateProposalReasoning,

    // Components
    createComponent,
    updateComponent,
    deleteComponent,

    // Use Cases
    createUseCase,
    updateUseCase,
    deleteUseCase,

    // Options
    createOption,
    updateOption,
    deleteOption,
    setSelectedOption,
    updateOptionDescription,
    updateOptionDiagram,

    // Drivers
    createDriver,
    updateDriver,
    deleteDriver,

    // Evaluations
    updateEvaluationRating,
    updateEvaluationDetails,

    // Confluence
    updateConfluenceUrl,
    pushingToConfluence,
    pushToConfluence,
  }
}
