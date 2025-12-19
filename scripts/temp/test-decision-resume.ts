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

// Test 1: First call - creates a new session
console.log('=== Test 1: First call (no session) ===')
const result1 = await runDecisionAgent(simpleDecision, 'add a new option called "Flow"')
console.log('Session ID:', result1.sessionId)
console.log('New options:', result1.decision.options.map(o => o.name))

// Test 2: Second call - resume the session
console.log('\n=== Test 2: Resume session ===')
const result2 = await runDecisionAgent(result1.decision, 'add another option called "ReScript"', result1.sessionId)
console.log('Session ID:', result2.sessionId)
console.log('New options:', result2.decision.options.map(o => o.name))

console.log('\nDone!')
