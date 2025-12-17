---
to: apps/backend-<%= serviceName %>/src/actions/<%= actionPath %>/<%= method %>.action.ts
---
<%
// Calculate relative path to generated directory based on action path depth
const pathDepth = actionPath.split('/').length + 1; // +1 for the method file itself
const relativePath = '../'.repeat(pathDepth) + 'generated/zod.gen.js';
-%>
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { <% if (hasParams || (method === 'post' || method === 'patch' || method === 'put')) { %>z<%= h.changeCase.pascalCase(functionName) %>Data, <% } %>z<%= h.changeCase.pascalCase(functionName) %>Response } from '<%= relativePath %>'

export function <%= h.changeCase.camelCase(functionName) %>(<% if (hasParams || (method === 'post' || method === 'patch' || method === 'put')) { %>
  request: FastifyRequest<{
    <% if (hasParams) { %>Params: z.infer<typeof z<%= h.changeCase.pascalCase(functionName) %>Data.shape.path><% if (method === 'post' || method === 'patch' || method === 'put') { %>; <% } %><% } %>
    <% if (method === 'post' || method === 'patch' || method === 'put') { %>Body: z.infer<typeof z<%= h.changeCase.pascalCase(functionName) %>Data.shape.body><% } %>
  }, ZodTypeProvider>,<% } else { %>
  request: FastifyRequest<Record<string, never>, ZodTypeProvider>,<% } %>
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof z<%= h.changeCase.pascalCase(functionName) %>Response>> {
  try {
<% if (hasParams) { -%>
    const { <%= params.map(p => `${p}: _${p}`).join(', ') %> } = request.params
<% } -%>
<% if (method === 'post' || method === 'patch' || method === 'put') { -%>
    const _body = request.body
<% } -%>

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
