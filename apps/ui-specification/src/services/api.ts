const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4002/api'

export interface SpecificationRequirementItem {
  type:
    | 'ubiquitous'
    | 'event-driven'
    | 'state-driven'
    | 'optional-feature'
    | 'unwanted-behaviour'
    | 'complex'
  systemName: string
  systemResponse: string
  triggers?: string[]
  preConditions?: string[]
  features?: string[]
  unwantedConditions?: string[]
}

export interface SpecificationSection {
  sectionName: string
  items: SpecificationRequirementItem[]
}

export interface Specification {
  title: string
  description: string
  requirements: SpecificationSection[]
}

export interface SpecificationSummary {
  id: string
  title: string
  description: string
  filepath: string
  project: string
}

export interface SpecificationDetail extends Specification {
  id: string
}

export const api = {
  async getSpecifications(): Promise<SpecificationSummary[]> {
    const response = await fetch(`${API_BASE_URL}/specifications`)
    if (!response.ok) {
      throw new Error('Failed to load specifications')
    }
    const data = await response.json()
    return data.specifications
  },

  async getSpecification(id: string): Promise<SpecificationDetail> {
    const response = await fetch(`${API_BASE_URL}/specifications/${encodeURIComponent(id)}`)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Specification not found')
      }
      throw new Error('Failed to load specification')
    }
    return response.json()
  },
}
