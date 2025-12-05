import { decision } from '@magik/decisions'
import { z } from 'zod'
import type { DecisionChange } from './interface.type.js'

type Decision = z.infer<typeof decision>

export function applyChanges(inputDecision: Decision, changes: DecisionChange[]): Decision {
  // Create a deep copy of the decision
  const result = JSON.parse(JSON.stringify(inputDecision)) as Decision

  for (const change of changes) {
    switch (change.type) {
      case 'addComponent':
        result.components.push(change.component)
        break

      case 'updateComponent': {
        const component = result.components.find((c: { id: string }) => c.id === change.componentId)
        if (component) {
          if (change.updates.name !== undefined) {
            component.name = change.updates.name
          }
          if (change.updates.description !== undefined) {
            component.description = change.updates.description
          }
        }
        break
      }

      case 'removeComponent':
        result.components = result.components.filter(
          (c: { id: string }) => c.id !== change.componentId
        )
        break

      case 'addDriver':
        result.decisionDrivers.push(change.driver)
        break

      case 'updateDriver': {
        const driver = result.decisionDrivers.find((d: { id: string }) => d.id === change.driverId)
        if (driver) {
          if (change.updates.name !== undefined) {
            driver.name = change.updates.name
          }
          if (change.updates.description !== undefined) {
            driver.description = change.updates.description
          }
        }
        break
      }

      case 'removeDriver':
        result.decisionDrivers = result.decisionDrivers.filter(
          (d: { id: string }) => d.id !== change.driverId
        )
        // Also remove related evaluations
        result.evaluationMatrix = result.evaluationMatrix.filter(
          (e: { driverId: string }) => e.driverId !== change.driverId
        )
        break

      case 'addOption':
        result.options.push(change.option)
        break

      case 'updateOption': {
        const option = result.options.find((o: { id: string }) => o.id === change.optionId)
        if (option) {
          if (change.updates.name !== undefined) {
            option.name = change.updates.name
          }
          if (change.updates.description !== undefined) {
            option.description = change.updates.description
          }
          if (change.updates.moreLink !== undefined) {
            option.moreLink = change.updates.moreLink
          }
          if (change.updates.architectureDiagramLink !== undefined) {
            option.architectureDiagramLink = change.updates.architectureDiagramLink
          }
          if (change.updates.architectureDiagramMermaid !== undefined) {
            option.architectureDiagramMermaid = change.updates.architectureDiagramMermaid
          }
        }
        break
      }

      case 'removeOption':
        result.options = result.options.filter((o: { id: string }) => o.id !== change.optionId)
        // Also remove related evaluations
        result.evaluationMatrix = result.evaluationMatrix.filter(
          (e: { optionId: string }) => e.optionId !== change.optionId
        )
        // Clear selected option if it was the removed one
        if (result.selectedOption === change.optionId) {
          result.selectedOption = undefined
        }
        break

      case 'addEvaluation':
        result.evaluationMatrix.push(change.evaluation)
        break

      case 'updateEvaluation': {
        const evaluation = result.evaluationMatrix.find(
          (e: { optionId: string; driverId: string }) =>
            e.optionId === change.optionId && e.driverId === change.driverId
        )
        if (evaluation) {
          if (change.updates.rating !== undefined) {
            evaluation.rating = change.updates.rating
          }
          if (change.updates.evaluationDetails !== undefined) {
            evaluation.evaluationDetails = change.updates.evaluationDetails
          }
        }
        break
      }

      case 'removeEvaluation':
        result.evaluationMatrix = result.evaluationMatrix.filter(
          (e: { optionId: string; driverId: string }) =>
            !(e.optionId === change.optionId && e.driverId === change.driverId)
        )
        break

      case 'updateProblemDefinition':
        result.problemDefinition = change.problemDefinition
        break

      case 'updateProposal':
        result.proposal = change.proposal
        break

      case 'setSelectedOption':
        result.selectedOption = change.selectedOption
        break

      case 'setConfluenceLink':
        result.confluenceLink = change.confluenceLink
        break

      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = change
        throw new Error(`Unknown change type: ${(_exhaustive as any).type}`)
    }
  }

  return result
}
