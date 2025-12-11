---
to: apps/backend-<%= serviceName %>/src/actions/<%= actionPath %>/<%= method %>.action.ts
---
import type { FastifyRequest, FastifyReply } from 'fastify'

<% if (method === 'get') { -%>
<% if (hasParams) { -%>
interface <%= h.changeCase.pascalCase(functionName) %>Params {
<% params.forEach(param => { -%>
  <%= param %>: string
<% }) -%>
}

export async function <%= h.changeCase.camelCase(functionName) %>(
  request: FastifyRequest<{ Params: <%= h.changeCase.pascalCase(functionName) %>Params }>,
  reply: FastifyReply
) {
  try {
    const { <%= params.join(', ') %> } = request.params

    // TODO: Implement your logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
<% } else { -%>
export async function <%= h.changeCase.camelCase(functionName) %>(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // TODO: Implement your logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
<% } -%>
<% } else if (method === 'post' || method === 'patch' || method === 'put') { -%>
<% if (hasParams) { -%>
interface <%= h.changeCase.pascalCase(functionName) %>Params {
<% params.forEach(param => { -%>
  <%= param %>: string
<% }) -%>
}
<% } -%>

interface <%= h.changeCase.pascalCase(functionName) %>Body {
  // TODO: Define your request body interface
}

export async function <%= h.changeCase.camelCase(functionName) %>(
  request: FastifyRequest<{ <% if (hasParams) { %>Params: <%= h.changeCase.pascalCase(functionName) %>Params; <% } %>Body: <%= h.changeCase.pascalCase(functionName) %>Body }>,
  reply: FastifyReply
) {
  try {
<% if (hasParams) { -%>
    const { <%= params.join(', ') %> } = request.params
<% } -%>
    const body = request.body

    // TODO: Implement your logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
<% } else if (method === 'delete') { -%>
<% if (hasParams) { -%>
interface <%= h.changeCase.pascalCase(functionName) %>Params {
<% params.forEach(param => { -%>
  <%= param %>: string
<% }) -%>
}

export async function <%= h.changeCase.camelCase(functionName) %>(
  request: FastifyRequest<{ Params: <%= h.changeCase.pascalCase(functionName) %>Params }>,
  reply: FastifyReply
) {
  try {
    const { <%= params.join(', ') %> } = request.params

    // TODO: Implement your delete logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
<% } else { -%>
export async function <%= h.changeCase.camelCase(functionName) %>(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // TODO: Implement your delete logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
<% } -%>
<% } -%>
