import { query } from '@anthropic-ai/claude-agent-sdk'

// Test 1: Create a session and get its ID
console.log('=== Test 1: Create initial session ===')

const stream1 = query({
  prompt: 'What is 2+2? Just answer with the number.',
  options: {
    model: 'claude-haiku-4-5',
    systemPrompt: 'You are a helpful assistant. Be brief.',
  },
})

let sessionId: string | undefined

for await (const message of stream1) {
  if (message.type === 'system' && message.subtype === 'init') {
    sessionId = message.session_id
    console.log('Session ID:', sessionId)
  }
  if (message.type === 'assistant' && message.message?.content) {
    for (const content of message.message.content) {
      if (content.type === 'text') {
        console.log('Response:', content.text)
      }
    }
  }
  if (message.type === 'result') {
    console.log('Result:', message.subtype)
  }
}

console.log('\n=== Test 2: Resume the same session ===')

const stream2 = query({
  prompt: 'What was the previous question I asked you?',
  options: {
    model: 'claude-haiku-4-5',
    resume: sessionId,
    systemPrompt: 'You are a helpful assistant. Be brief.',
  },
})

for await (const message of stream2) {
  if (message.type === 'system' && message.subtype === 'init') {
    console.log('Resumed session ID:', message.session_id)
  }
  if (message.type === 'assistant' && message.message?.content) {
    for (const content of message.message.content) {
      if (content.type === 'text') {
        console.log('Response:', content.text)
      }
    }
  }
  if (message.type === 'result') {
    console.log('Result:', message.subtype)
  }
}

console.log('\n=== Test 3: Try to resume with a fake/invalid session ID ===')

try {
  const stream3 = query({
    prompt: 'Hello',
    options: {
      model: 'claude-haiku-4-5',
      resume: '00000000-0000-0000-0000-000000000000',
      systemPrompt: 'You are a helpful assistant. Be brief.',
    },
  })

  for await (const message of stream3) {
    if (message.type === 'system') {
      console.log('System message:', message.subtype)
    }
    if (message.type === 'result') {
      console.log('Result:', message.subtype)
    }
  }
} catch (err) {
  console.log('Error with invalid session:', err)
}

console.log('\nDone!')
