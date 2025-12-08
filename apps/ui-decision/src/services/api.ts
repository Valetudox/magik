import type { decision } from '@magik/decisions'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

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
    const data = (await response.json()) as { decisions: DecisionSummary[] }
    return data.decisions
  },

  async createDecision(filename: string): Promise<{ success: boolean; id: string }> {
    const response = await fetch(`${API_BASE_URL}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to create decision')
    }
    return response.json() as Promise<{ success: boolean; id: string }>
  },

  async deleteDecision(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/decisions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to delete decision')
    }
    return response.json() as Promise<{ success: boolean }>
  },

  async getDecision(id: string): Promise<DecisionDetail> {
    const response = await fetch(`${API_BASE_URL}/decisions/${encodeURIComponent(id)}`)
    return response.json() as Promise<DecisionDetail>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update decision')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string; details?: string }
      throw new Error(error.error ?? error.details ?? 'Failed to push to Confluence')
    }

    return response.json() as Promise<{ success: boolean; message: string; error?: string }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to process with agent')
    }

    return response.json() as Promise<{ success: boolean; message: string }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update rating')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to create option')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to create driver')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update option')
    }
    return response.json() as Promise<{ success: boolean }>
  },

  async deleteOption(decisionId: string, optionId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/options/${optionId}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to delete option')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update driver')
    }
    return response.json() as Promise<{ success: boolean }>
  },

  async deleteDriver(decisionId: string, driverId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/drivers/${driverId}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to delete driver')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update evaluation details')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update selected option')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to create component')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update component')
    }
    return response.json() as Promise<{ success: boolean }>
  },

  async deleteComponent(decisionId: string, componentId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/components/${componentId}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to delete component')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to create use case')
    }
    return response.json() as Promise<{ success: boolean }>
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
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update use case')
    }
    return response.json() as Promise<{ success: boolean }>
  },

  async deleteUseCase(decisionId: string, useCaseId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/decisions/${encodeURIComponent(decisionId)}/use-cases/${useCaseId}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to delete use case')
    }
    return response.json() as Promise<{ success: boolean }>
  },
}
