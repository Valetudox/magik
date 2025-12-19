import { runDecisionAgent } from '@magik/agents'

const simpleDecision = {
  id: 'test-decision',
  problemDefinition: 'Should we use TypeScript or JavaScript?',
  components: [],
  useCases: [],
  decisionDrivers: [
    { id: 'driver1', name: 'Type Safety', description: 'How well does it catch errors at compile time' },
  ],
  options: [
    { id: 'option1', name: 'TypeScript', description: 'Typed superset of JavaScript' },
    { id: 'option2', name: 'JavaScript', description: 'Dynamic scripting language' },
  ],
  evaluationMatrix: [
    { optionId: 'option1', driverId: 'driver1', rating: 'high' as const, evaluationDetails: ['Strong typing'] },
    { optionId: 'option2', driverId: 'driver1', rating: 'low' as const, evaluationDetails: ['No types'] },
  ],
  proposal: {
    description: 'Use TypeScript',
    reasoning: ['Better type safety'],
  },
}

console.log('Running decision agent...')
const result = await runDecisionAgent(
  simpleDecision,
  'add a new option called "Flow" with description "Static type checker for JavaScript". Also add the evaluation for it with "medium" rating for Type Safety.'
)
console.log('Result:', JSON.stringify(result.decision, null, 2))
