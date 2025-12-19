const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4004'

export type TableRow = {
  id: string
  use_case: string
  diagram?: string
  required_context?: string[]
  required_tools?: string[]
  potential_interactions?: string[]
  notes?: string[]
}

export type TableDocumentSummary = {
  id: string
  name: string
  directory: string
  useCaseCount: number
  confluence_url?: string
  createdAt: string
  updatedAt: string
}

export type TableDocumentDetail = {
  id: string
  confluence_url?: string
  table: TableRow[]
  aiSessionId?: string
}

export const api = {
  async getTableDocuments(): Promise<TableDocumentSummary[]> {
    const response = await fetch(`${API_BASE_URL}/api/table-documents`)
    const data = (await response.json()) as { documents: TableDocumentSummary[] }
    return data.documents
  },

  async createTableDocument(filename: string): Promise<{ success: boolean; id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/table-documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to create table document')
    }
    return response.json() as Promise<{ success: boolean; id: string }>
  },

  async deleteTableDocument(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/table-documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to delete table document')
    }
    return response.json() as Promise<{ success: boolean }>
  },

  async getTableDocument(id: string): Promise<TableDocumentDetail> {
    const response = await fetch(`${API_BASE_URL}/api/table-documents/${encodeURIComponent(id)}`)
    return response.json() as Promise<TableDocumentDetail>
  },

  async updateTableDocument(
    id: string,
    updates: { confluence_url?: string }
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/table-documents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update table document')
    }
    return response.json() as Promise<{ success: boolean }>
  },

  async createUseCase(
    documentId: string,
    useCase: Omit<TableRow, 'id'>
  ): Promise<{ success: boolean; useCase: TableRow }> {
    const response = await fetch(
      `${API_BASE_URL}/api/table-documents/${encodeURIComponent(documentId)}/use-cases`,
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
    return response.json() as Promise<{ success: boolean; useCase: TableRow }>
  },

  async updateUseCase(
    documentId: string,
    useCaseId: string,
    updates: Partial<Omit<TableRow, 'id'>>
  ): Promise<{ success: boolean; useCase: TableRow }> {
    const response = await fetch(
      `${API_BASE_URL}/api/table-documents/${encodeURIComponent(documentId)}/use-cases/${encodeURIComponent(useCaseId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    )
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to update use case')
    }
    return response.json() as Promise<{ success: boolean; useCase: TableRow }>
  },

  async deleteUseCase(documentId: string, useCaseId: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/api/table-documents/${encodeURIComponent(documentId)}/use-cases/${encodeURIComponent(useCaseId)}`,
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

  async pushToConfluence(id: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/api/table-documents/${encodeURIComponent(id)}/push-to-confluence`,
      {
        method: 'POST',
      }
    )
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to push to Confluence')
    }
    return response.json() as Promise<{ success: boolean }>
  },

  async askAgent(id: string, prompt: string): Promise<{ success: boolean }> {
    const response = await fetch(
      `${API_BASE_URL}/api/table-documents/${encodeURIComponent(id)}/agent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }
    )
    if (!response.ok) {
      const error = (await response.json()) as { error?: string }
      throw new Error(error.error ?? 'Failed to run agent')
    }
    return response.json() as Promise<{ success: boolean }>
  },
}
