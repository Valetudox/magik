import type { decision } from '@magik/decisions'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export interface DecisionSummary {
  id: string
  name: string
  directory: string
  problemDefinition: string
  selectedOption?: string
  confluenceLink?: string
  createdAt: string
  updatedAt: string
}

export interface DecisionDetail extends decision {
  id: string
}

export const api = {
  async getDecisions(): Promise<DecisionSummary[]> {
    const response = await fetch(`${API_BASE_URL}/decisions`)
    const data = await response.json()
    return data.decisions
  },

  async createDecision(filename: string): Promise<{ success: boolean; id: string }> {
    const response = await fetch(`${API_BASE_URL}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create decision')
    }
    return response.json()
  },

  async deleteDecision(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/decisions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete decision')
    }
    return response.json()
  },

  async getDecision(id: string): Promise<DecisionDetail> {
    const response = await fetch(`${API_BASE_URL}/decisions/${encodeURIComponent(id)}`)
    return response.json()
  },

  async updateDecision(
    id: string,
    updates: { problemDefinition?: string; proposal?: { description: string; reasoning: string[] } }
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/decisions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update decision')
    }
    return response.json()
  },

  async pushToConfluence(
    id: string,
    confluenceUrl: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(id)}/push-to-confluence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confluenceUrl }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.details || 'Failed to push to Confluence')
    }

    return response.json()
  },

  async askAgent(id: string, prompt: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/decisions/${encodeURIComponent(id)}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to process with agent')
    }

    return response.json()
  },

  async updateEvaluationRating(
    decisionId: string,
    optionId: string,
    driverId: string,
    rating: 'high' | 'medium' | 'low'
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/evaluations`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, driverId, rating }),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update rating')
    }
    return response.json()
  },

  async createOption(
    decisionId: string,
    option: { name: string; description: string; moreLink?: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/options`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(option),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create option')
    }
    return response.json()
  },

  async createDriver(
    decisionId: string,
    driver: { name: string; description: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/drivers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driver),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create driver')
    }
    return response.json()
  },

  async updateOption(
    decisionId: string,
    optionId: string,
    option: { name: string; description: string; moreLink?: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/options/${optionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(option),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update option')
    }
    return response.json()
  },

  async deleteOption(decisionId: string, optionId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/options/${optionId}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete option')
    }
    return response.json()
  },

  async updateDriver(
    decisionId: string,
    driverId: string,
    driver: { name: string; description: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/drivers/${driverId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driver),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update driver')
    }
    return response.json()
  },

  async deleteDriver(decisionId: string, driverId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/drivers/${driverId}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete driver')
    }
    return response.json()
  },

  async updateEvaluationDetails(
    decisionId: string,
    optionId: string,
    driverId: string,
    evaluationDetails: string[]
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/evaluations/details`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, driverId, evaluationDetails }),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update evaluation details')
    }
    return response.json()
  },

  async setSelectedOption(
    decisionId: string,
    optionId: string | null
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/selected-option`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update selected option')
    }
    return response.json()
  },

  async createComponent(
    decisionId: string,
    component: { name: string; description: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/components`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(component),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create component')
    }
    return response.json()
  },

  async updateComponent(
    decisionId: string,
    componentId: string,
    component: { name: string; description: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/components/${componentId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(component),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update component')
    }
    return response.json()
  },

  async deleteComponent(decisionId: string, componentId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/components/${componentId}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete component')
    }
    return response.json()
  },

  async createUseCase(
    decisionId: string,
    useCase: { name: string; description: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/use-cases`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(useCase),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create use case')
    }
    return response.json()
  },

  async updateUseCase(
    decisionId: string,
    useCaseId: string,
    useCase: { name: string; description: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/use-cases/${useCaseId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(useCase),
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update use case')
    }
    return response.json()
  },

  async deleteUseCase(decisionId: string, useCaseId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/use-cases/${useCaseId}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete use case')
    }
    return response.json()
  },
}
