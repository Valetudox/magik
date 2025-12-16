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

export function <%= h.changeCase.camelCase(functionName) %>(
  request: FastifyRequest<{ Params: <%= h.changeCase.pascalCase(functionName) %>Params }>,
  reply: FastifyReply
) {
  try {
    const { <%= params.map(p => `${p}: _${p}`).join(', ') %> } = request.params

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
<% } else { -%>
export function <%= h.changeCase.camelCase(functionName) %>(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
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

type <%= h.changeCase.pascalCase(functionName) %>Body = Record<string, unknown>

export function <%= h.changeCase.camelCase(functionName) %>(
  request: FastifyRequest<{ <% if (hasParams) { %>Params: <%= h.changeCase.pascalCase(functionName) %>Params; <% } %>Body: <%= h.changeCase.pascalCase(functionName) %>Body }>,
  reply: FastifyReply
) {
  try {
<% if (hasParams) { -%>
    const { <%= params.map(p => `${p}: _${p}`).join(', ') %> } = request.params
<% } -%>
    const _body = request.body

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
<% } else if (method === 'delete') { -%>
<% if (hasParams) { -%>
interface <%= h.changeCase.pascalCase(functionName) %>Params {
<% params.forEach(param => { -%>
  <%= param %>: string
<% }) -%>
}

export function <%= h.changeCase.camelCase(functionName) %>(
  request: FastifyRequest<{ Params: <%= h.changeCase.pascalCase(functionName) %>Params }>,
  reply: FastifyReply
) {
  try {
    const { <%= params.map(p => `${p}: _${p}`).join(', ') %> } = request.params

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
<% } else { -%>
export function <%= h.changeCase.camelCase(functionName) %>(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
<% } -%>
<% } -%>
