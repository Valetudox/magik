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

  const showError = (err: unknown, fallbackMessage: string) => {
    notification.value = {
      show: true,
      message: (err as Error).message ?? fallbackMessage,
      type: 'error',
    }
  }

  const showSuccess = (message: string) => {
    notification.value = {
      show: true,
      message,
      type: 'success',
    }
  }

  // Problem Definition
  const updateProblemDefinition = async (value: string) => {
    try {
      await api.updateDecision(decisionId, { problemDefinition: value })
    } catch (err) {
      showError(err, 'Failed to update problem definition')
    }
  }

  // Proposal
  const updateProposalDescription = async (value: string) => {
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

  const updateProposalReasoning = async (value: string[]) => {
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
  const createComponent = async (data: { name: string; description: string }) => {
    try {
      await api.createComponent(decisionId, data)
    } catch (err) {
      showError(err, 'Failed to create component')
    }
  }

  const updateComponent = async (id: string, data: { name: string; description: string }) => {
    try {
      await api.updateComponent(decisionId, id, data)
    } catch (err) {
      showError(err, 'Failed to update component')
    }
  }

  const deleteComponent = async (id: string) => {
    try {
      await api.deleteComponent(decisionId, id)
    } catch (err) {
      showError(err, 'Failed to delete component')
    }
  }

  // Use Cases
  const createUseCase = async (data: { name: string; description: string }) => {
    try {
      await api.createUseCase(decisionId, data)
    } catch (err) {
      showError(err, 'Failed to create use case')
    }
  }

  const updateUseCase = async (id: string, data: { name: string; description: string }) => {
    try {
      await api.updateUseCase(decisionId, id, data)
    } catch (err) {
      showError(err, 'Failed to update use case')
    }
  }

  const deleteUseCase = async (id: string) => {
    try {
      await api.deleteUseCase(decisionId, id)
    } catch (err) {
      showError(err, 'Failed to delete use case')
    }
  }

  // Options
  const createOption = async (data: { name: string; description: string; moreLink?: string }) => {
    try {
      await api.createOption(decisionId, data)
    } catch (err) {
      showError(err, 'Failed to create option')
    }
  }

  const updateOption = async (id: string, data: { name: string; description: string; moreLink?: string }) => {
    try {
      await api.updateOption(decisionId, id, data)
    } catch (err) {
      showError(err, 'Failed to update option')
    }
  }

  const deleteOption = async (id: string) => {
    try {
      await api.deleteOption(decisionId, id)
    } catch (err) {
      showError(err, 'Failed to delete option')
    }
  }

  const setSelectedOption = async (optionId: string | null) => {
    try {
      await api.setSelectedOption(decisionId, optionId)
    } catch (err) {
      showError(err, 'Failed to update selection')
    }
  }

  const updateOptionDescription = async (optionId: string, description: string) => {
    const option = decision.value?.options.find((o) => o.id === optionId)
    if (!option) return

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

  const updateOptionDiagram = async (_optionId: string, _diagram: string) => {
    // TODO: Add API method to update architecture diagram
    showError(new Error('Not implemented'), 'Diagram update not yet implemented')
  }

  // Drivers
  const createDriver = async (data: { name: string; description: string }) => {
    try {
      await api.createDriver(decisionId, data)
    } catch (err) {
      showError(err, 'Failed to create driver')
    }
  }

  const updateDriver = async (id: string, data: { name: string; description: string }) => {
    try {
      await api.updateDriver(decisionId, id, data)
    } catch (err) {
      showError(err, 'Failed to update driver')
    }
  }

  const deleteDriver = async (id: string) => {
    try {
      await api.deleteDriver(decisionId, id)
    } catch (err) {
      showError(err, 'Failed to delete driver')
    }
  }

  // Evaluations
  const updateEvaluationRating = async (
    optionId: string,
    driverId: string,
    rating: 'high' | 'medium' | 'low' | null
  ) => {
    try {
      // API expects rating without null, but we handle null as clearing the rating
      await api.updateEvaluationRating(decisionId, optionId, driverId, rating as 'high' | 'medium' | 'low')
    } catch (err) {
      showError(err, 'Failed to update rating')
    }
  }

  const updateEvaluationDetails = async (
    optionId: string,
    driverId: string,
    details: string[]
  ) => {
    try {
      await api.updateEvaluationDetails(decisionId, optionId, driverId, details)
    } catch (err) {
      showError(err, 'Failed to update evaluation details')
    }
  }

  // Confluence
  const updateConfluenceUrl = async (value: string) => {
    try {
      await api.updateDecision(decisionId, { confluenceLink: value })
    } catch (err) {
      showError(err, 'Failed to update Confluence URL')
    }
  }

  const pushingToConfluence = ref(false)

  const pushToConfluence = async () => {
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

