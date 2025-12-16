export interface TableDocument {
  success?: boolean
  id: string
  title: string
  description?: string
  useCases: UseCase[]
  createdAt: string
  updatedAt: string
}

export interface UseCase {
  success?: boolean
  id: string
  title: string
  description?: string
  actors?: string[]
  preconditions?: string[]
  steps?: string[]
  postconditions?: string[]
}

export interface CreateTableDocumentRequest {
  title: string
  description?: string
}

export interface UpdateTableDocumentRequest {
  title?: string
  description?: string
}

export interface CreateUseCaseRequest {
  title: string
  description?: string
  actors?: string[]
  preconditions?: string[]
  steps?: string[]
  postconditions?: string[]
}

export interface UpdateUseCaseRequest {
  title?: string
  description?: string
  actors?: string[]
  preconditions?: string[]
  steps?: string[]
  postconditions?: string[]
}

export interface Error {
  error: string
}
