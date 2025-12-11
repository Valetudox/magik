//Type definitions for backend-decision service
//Note: Some types are currently defined in service files and could be moved here for better organization

export interface DecisionResponse {
  id: string
  [key: string]: unknown
}
