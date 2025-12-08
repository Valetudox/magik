# Backend Code Generation Tools Research

**Date**: 2025-12-08
**Issue**: #31
**Purpose**: Research code generation tools to automate backend scaffolding while maintaining strict lint and validation rules

---

## Executive Summary

This document provides comprehensive research on integrating code generation tools (Plop.js, Hygen, Fastify autoload) for the Magik backend services. Our goal is to reduce manual work while ensuring generated code follows our strict conventions:

- Folder-based routing with `[param]` folders (Next.js style)
- Action file naming: `get.action.ts`, `post.action.ts`, `patch.action.ts`, `delete.action.ts`
- Triple validation: ESLint + structure validator + route-action alignment validator

**Key Findings**:
- **Plop.js** is the recommended choice for code generation with strong template and validation capabilities
- **Fastify autoload** is NOT recommended - it conflicts with our current architecture and validation system
- **Hygen** is a viable alternative to Plop.js but offers fewer advantages

---

## Table of Contents

1. [Plop.js Detailed Analysis](#1-plopjs-detailed-analysis)
2. [Code Generator Comparison](#2-code-generator-comparison)
3. [Fastify Autoload Analysis](#3-fastify-autoload-analysis)
4. [Recommendations](#4-recommendations)
5. [Proof of Concept](#5-proof-of-concept)
6. [Migration Strategy](#6-migration-strategy)

---

## 1. Plop.js Detailed Analysis

### 1.1 What is Plop.js?

Plop.js is a micro-generator framework that makes it easy to create code consistency across teams. It uses:
- **Handlebars templates** for file generation
- **Inquirer.js** for interactive prompts
- **Actions system** for file manipulation (add, modify, append, custom)

### 1.2 Core Capabilities

#### A. Template System (Handlebars)

Plop uses Handlebars for powerful templating:

```handlebars
{{!-- Template: plop-templates/action.hbs --}}
import type { FastifyRequest, FastifyReply } from 'fastify'

{{#if hasParams}}
interface {{pascalCase actionName}}Params {
  {{#each params}}
  {{this}}: string
  {{/each}}
}
{{/if}}

{{#if hasBody}}
interface {{pascalCase actionName}}Body {
  // TODO: Define request body interface
}
{{/if}}

export async function {{camelCase actionName}}(
  request: FastifyRequest<{
    {{#if hasParams}}Params: {{pascalCase actionName}}Params{{/if}}
    {{#if hasBody}}{{#if hasParams}}, {{/if}}Body: {{pascalCase actionName}}Body{{/if}}
  }>,
  reply: FastifyReply
) {
  try {
    {{#if hasParams}}
    const { {{#each params}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} } = request.params
    {{/if}}
    {{#if hasBody}}
    const body = request.body
    {{/if}}

    // TODO: Implement {{method}} {{route}} logic

    reply.status(200).send({ message: 'Not implemented' })
  } catch (error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
```

#### B. Interactive Prompts

```javascript
// plopfile.js
module.exports = function (plop) {
  plop.setGenerator('action', {
    description: 'Create a new backend action',
    prompts: [
      {
        type: 'list',
        name: 'service',
        message: 'Which backend service?',
        choices: ['backend-decision', 'backend-socket', 'backend-auth'],
      },
      {
        type: 'list',
        name: 'method',
        message: 'HTTP method?',
        choices: ['get', 'post', 'patch', 'delete'],
      },
      {
        type: 'input',
        name: 'route',
        message: 'Route path (e.g., /api/decisions/:id/options/:optionId):',
        validate: (input) => {
          if (!input.startsWith('/api/')) {
            return 'Route must start with /api/'
          }
          return true
        },
      },
      {
        type: 'confirm',
        name: 'hasBody',
        message: 'Does this action accept a request body?',
        default: false,
      },
    ],
    actions: [
      // Actions defined below
    ],
  })
}
```

#### C. Actions System

Plop supports multiple action types:

**1. Add Action** - Create new files
```javascript
{
  type: 'add',
  path: 'apps/{{service}}/src/actions/{{routePath}}/{{method}}.action.ts',
  templateFile: 'plop-templates/action.hbs',
}
```

**2. Modify Action** - Update existing files
```javascript
{
  type: 'modify',
  path: 'apps/{{service}}/src/routes.ts',
  pattern: /(\/\/ PLOP_INJECT_IMPORT)/gi,
  template: "import { {{camelCase actionName}} } from './actions/{{routePath}}/{{method}}.action'\n$1",
}
```

**3. Append Action** - Add content to end of file
```javascript
{
  type: 'append',
  path: 'apps/{{service}}/src/routes.ts',
  pattern: /(\/\/ PLOP_INJECT_ROUTE)/gi,
  template: "  fastify.{{method}}('{{route}}', {{camelCase actionName}})",
}
```

**4. Custom Action** - Run custom JavaScript
```javascript
{
  type: 'custom',
  action: async (data) => {
    // Validate generated code against ESLint
    const { execSync } = require('child_process')
    try {
      execSync(`cd apps/${data.service} && bun run lint`, { stdio: 'inherit' })
      return 'ESLint validation passed'
    } catch (error) {
      throw new Error('ESLint validation failed')
    }
  },
}
```

### 1.3 How Plop.js Addresses Our Requirements

#### Requirement 1: Follow Folder-Based Routing Structure

**Solution**: Dynamic path generation with custom helpers

```javascript
// plopfile.js
module.exports = function (plop) {
  // Custom helper to convert route to folder path
  plop.setHelper('routeToFolderPath', function (route) {
    // Remove /api/ prefix
    let path = route.replace(/^\/api\//, '')

    // Convert :param to [param]
    path = path.replace(/:([a-zA-Z0-9]+)/g, '[$1]')

    // Return folder path
    return path
  })

  // Custom helper to extract params from route
  plop.setHelper('extractParams', function (route) {
    const matches = route.match(/:([a-zA-Z0-9]+)/g) || []
    return matches.map(m => m.substring(1))
  })
}
```

**Usage in action**:
```javascript
{
  type: 'add',
  path: 'apps/{{service}}/src/actions/{{routeToFolderPath route}}/{{method}}.action.ts',
  templateFile: 'plop-templates/action.hbs',
  data: {
    params: (data) => {
      const matches = data.route.match(/:([a-zA-Z0-9]+)/g) || []
      return matches.map(m => m.substring(1))
    },
    hasParams: (data) => /:/.test(data.route),
  },
}
```

**Examples**:
```
Input: POST /api/decisions/:id/options
Output: apps/backend-decision/src/actions/decisions/[id]/options/post.action.ts

Input: DELETE /api/decisions/:id/drivers/:driverId
Output: apps/backend-decision/src/actions/decisions/[id]/drivers/[driverId]/delete.action.ts

Input: GET /api/decisions
Output: apps/backend-decision/src/actions/decisions/get.action.ts
```

#### Requirement 2: Generate Correctly Named Action Files

**Solution**: Template naming with method variable

```javascript
{
  type: 'add',
  path: 'apps/{{service}}/src/actions/{{routePath}}/{{method}}.action.ts',
  templateFile: 'plop-templates/action.hbs',
}
```

The `{{method}}` variable ensures correct naming:
- `get` → `get.action.ts`
- `post` → `post.action.ts`
- `patch` → `patch.action.ts`
- `delete` → `delete.action.ts`

#### Requirement 3: Update routes.ts Automatically

**Solution**: Modify/Append actions with injection markers

**Step 1**: Add injection markers to routes.ts
```typescript
// routes.ts
import type { FastifyInstance } from 'fastify'
// PLOP_INJECT_IMPORT

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => ({ status: 'ok' }))

  // PLOP_INJECT_ROUTE
}
```

**Step 2**: Use modify actions to inject imports
```javascript
{
  type: 'modify',
  path: 'apps/{{service}}/src/routes.ts',
  pattern: /(\/\/ PLOP_INJECT_IMPORT)/gi,
  template: "import { {{camelCase actionName}} } from './actions/{{routePath}}/{{method}}.action'\n$1",
}
```

**Step 3**: Use append actions to inject routes
```javascript
{
  type: 'append',
  path: 'apps/{{service}}/src/routes.ts',
  pattern: /(\/\/ PLOP_INJECT_ROUTE)/gi,
  template: "  fastify.{{method}}('{{route}}', {{camelCase actionName}})",
}
```

**Result**:
```typescript
// After running plop
import type { FastifyInstance } from 'fastify'
import { createOption } from './actions/decisions/[id]/options/post.action'
// PLOP_INJECT_IMPORT

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => ({ status: 'ok' }))

  fastify.post('/api/decisions/:id/options', createOption)
  // PLOP_INJECT_ROUTE
}
```

#### Requirement 4: Validate Against Lint Rules

**Solution**: Custom action with ESLint integration

```javascript
{
  type: 'custom',
  action: async (data) => {
    const { execSync } = require('child_process')
    const path = require('path')

    console.log('Running ESLint validation...')

    try {
      // Run ESLint on the service
      execSync(
        `cd apps/${data.service} && bun run lint`,
        { stdio: 'inherit' }
      )

      // Run route-action alignment validator
      execSync(
        'bun run scripts/lints/backend/validate-route-actions.ts',
        { stdio: 'inherit' }
      )

      return 'All validations passed ✓'
    } catch (error) {
      throw new Error('Validation failed - please fix errors above')
    }
  },
}
```

This ensures:
- File naming follows ESLint rules
- Folder naming follows conventions
- Route-action alignment is maintained

#### Requirement 5: Handle Nested Resources

**Solution**: Recursive path parsing

```javascript
plop.setHelper('routeToFolderPath', function (route) {
  let path = route.replace(/^\/api\//, '')

  const segments = path.split('/')
  const folders = segments.map(segment => {
    if (segment.startsWith(':')) {
      return `[${segment.substring(1)}]`
    }
    return segment
  })

  return folders.join('/')
})
```

**Examples**:
```
/api/decisions/:id/options/:optionId/evaluations
→ decisions/[id]/options/[optionId]/evaluations

/api/decisions/:id/components/:componentId
→ decisions/[id]/components/[componentId]

/api/users/:userId/projects/:projectId/tasks/:taskId
→ users/[userId]/projects/[projectId]/tasks/[taskId]
```

### 1.4 Advanced Plop.js Features

#### A. Multiple Generators

You can create different generators for different use cases:

```javascript
module.exports = function (plop) {
  // Generator 1: Create action
  plop.setGenerator('action', {
    description: 'Create a new backend action',
    prompts: [/* ... */],
    actions: [/* ... */],
  })

  // Generator 2: Create service
  plop.setGenerator('service', {
    description: 'Create a new service file',
    prompts: [/* ... */],
    actions: [/* ... */],
  })

  // Generator 3: Create complete resource
  plop.setGenerator('resource', {
    description: 'Create a complete CRUD resource',
    prompts: [/* ... */],
    actions: [
      // Generate GET collection
      // Generate POST create
      // Generate GET single
      // Generate PATCH update
      // Generate DELETE remove
    ],
  })
}
```

#### B. Conditional Actions

Actions can be conditional based on user input:

```javascript
actions: (data) => {
  const actions = []

  // Always create action file
  actions.push({
    type: 'add',
    path: 'apps/{{service}}/src/actions/{{routePath}}/{{method}}.action.ts',
    templateFile: 'plop-templates/action.hbs',
  })

  // Conditionally create service file
  if (data.createService) {
    actions.push({
      type: 'add',
      path: 'apps/{{service}}/src/services/{{resourceName}}.service.ts',
      templateFile: 'plop-templates/service.hbs',
    })
  }

  // Conditionally update routes
  if (data.updateRoutes) {
    actions.push({
      type: 'modify',
      path: 'apps/{{service}}/src/routes.ts',
      pattern: /(\/\/ PLOP_INJECT_IMPORT)/gi,
      template: "import { {{camelCase actionName}} } from './actions/{{routePath}}/{{method}}.action'\n$1",
    })
  }

  return actions
}
```

#### C. Custom Helpers

Register custom Handlebars helpers for complex transformations:

```javascript
plop.setHelper('upperCase', (txt) => txt.toUpperCase())
plop.setHelper('httpStatus', (method) => {
  return method === 'post' ? 201 : 200
})
plop.setHelper('extractResourceName', (route) => {
  const segments = route.split('/').filter(s => s && !s.startsWith(':'))
  return segments[segments.length - 1]
})
```

### 1.5 Best Practices for Our Use Case

#### 1. Use Injection Markers
```typescript
// routes.ts structure
import type { FastifyInstance } from 'fastify'
// PLOP_INJECT_IMPORT - DON'T REMOVE

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => ({ status: 'ok' }))

  // PLOP_INJECT_ROUTE - DON'T REMOVE
}
```

#### 2. Validate Route Format in Prompts
```javascript
{
  type: 'input',
  name: 'route',
  message: 'Route path:',
  validate: (input) => {
    if (!input.startsWith('/api/')) return 'Must start with /api/'
    if (!/^\/api\/[a-z0-9\-:\/]+$/.test(input)) return 'Invalid route format'
    return true
  },
}
```

#### 3. Always Run Validation After Generation
```javascript
actions: [
  // ... generation actions
  {
    type: 'custom',
    action: async (data) => {
      // Lint and validate
      execSync(`cd apps/${data.service} && bun run lint`)
      execSync('bun run scripts/lints/backend/validate-route-actions.ts')
      return 'Validation passed'
    },
  },
]
```

#### 4. Provide Clear Success Messages
```javascript
{
  type: 'custom',
  action: (data) => {
    return `
✓ Created: apps/${data.service}/src/actions/${data.routePath}/${data.method}.action.ts
✓ Updated: apps/${data.service}/src/routes.ts
✓ All validations passed

Next steps:
1. Implement the action logic
2. Add tests
3. Update OpenAPI spec
    `.trim()
  },
}
```

### 1.6 Limitations

1. **Requires Injection Markers**: routes.ts must have marker comments
2. **Manual Template Updates**: Templates need manual updates when patterns change
3. **No Built-in Rollback**: If generation fails mid-way, manual cleanup required
4. **Learning Curve**: Team needs to learn Handlebars syntax
5. **File Conflicts**: Won't detect if file already exists unless configured

### 1.7 Plop.js Summary

**Strengths**:
- Excellent template system with Handlebars
- Interactive prompts for user guidance
- Powerful actions for file manipulation
- Custom helpers for complex transformations
- Validation integration via custom actions
- Well-documented and actively maintained

**Fit for Our Project**: ⭐⭐⭐⭐⭐ (5/5)
- Can handle folder-based routing perfectly
- Supports automatic routes.ts updates
- Integrates with our validation tools
- Reduces boilerplate significantly

---

## 2. Code Generator Comparison

### 2.1 Plop.js vs Hygen vs Yeoman vs Custom Scripts

| Feature | Plop.js | Hygen | Yeoman | Custom Scripts |
|---------|---------|-------|--------|----------------|
| **Template Engine** | Handlebars | EJS | EJS/Custom | Any |
| **Interactive Prompts** | Inquirer.js | Built-in | Built-in | Manual |
| **File Modification** | Modify/Append actions | Inject actions | Manual | Manual |
| **Custom Actions** | Yes | Limited | Yes | Full control |
| **Validation Integration** | Custom actions | Post-hooks | Manual | Full control |
| **Learning Curve** | Low | Low | Medium | N/A |
| **Maintenance** | Framework handles | Framework handles | Framework handles | Self-maintained |
| **Configuration** | Single plopfile.js | Multiple files | Complex | Simple |
| **Community** | Active | Active | Declining | N/A |
| **TypeScript Support** | Good | Good | Fair | Excellent |

### 2.2 Detailed Comparison

#### A. Plop.js

**Setup**:
```bash
bun add -d plop
```

**Configuration**: Single file (`plopfile.js`)
```javascript
module.exports = function (plop) {
  plop.setGenerator('action', {
    description: 'Create backend action',
    prompts: [/* ... */],
    actions: [/* ... */],
  })
}
```

**Pros**:
- Simple setup and configuration
- Excellent documentation
- Powerful modify/append actions
- Custom helpers system
- Active community

**Cons**:
- Requires injection markers for modifications
- Handlebars learning curve
- Limited built-in validation

#### B. Hygen

**Setup**:
```bash
bun add -d hygen
```

**Configuration**: Multiple files in `_templates/` directory
```
_templates/
  action/
    new/
      prompt.js
      action.ejs.t
      routes.ejs.t
```

**prompt.js**:
```javascript
module.exports = {
  prompt: ({ inquirer }) => {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'service',
        message: 'Service?',
        choices: ['backend-decision', 'backend-socket'],
      },
    ])
  },
}
```

**action.ejs.t**:
```ejs
---
to: apps/<%= service %>/src/actions/<%= routePath %>/<%= method %>.action.ts
---
import type { FastifyRequest, FastifyReply } from 'fastify'

export async function <%= h.changeCase.camel(actionName) %>(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // TODO: Implement
}
```

**Pros**:
- Simple template syntax (EJS)
- Built-in inject action
- Good for monorepo structures
- Separate templates per use case

**Cons**:
- More files to maintain
- Less powerful modification actions
- Smaller community than Plop
- Limited custom action support

#### C. Yeoman

**Setup**:
```bash
npm install -g yo
npm install -g generator-<custom-name>
```

**Configuration**: Complex generator class structure

**Pros**:
- Very mature framework
- Extensive ecosystem
- Built for large-scale scaffolding

**Cons**:
- Overkill for our use case
- Complex setup
- Declining community
- Slower execution
- Global installation required

#### D. Custom Scripts

**Setup**:
```bash
# No dependencies
```

**Example**: Simple Node.js script
```javascript
#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Read inputs
// Generate files
// Update routes.ts
// Run validation
```

**Pros**:
- Full control
- No framework overhead
- Easy to debug
- TypeScript native

**Cons**:
- No interactive prompts (unless built)
- Manual template system
- Self-maintained
- Time-consuming to build

### 2.3 Recommendation Ranking

1. **Plop.js** ⭐⭐⭐⭐⭐
   - Best balance of features and simplicity
   - Excellent file modification capabilities
   - Easy to integrate with our validation
   - Strong community support

2. **Hygen** ⭐⭐⭐⭐
   - Good alternative to Plop
   - Simpler template syntax
   - Less powerful for modifications
   - Good for teams preferring EJS

3. **Custom Scripts** ⭐⭐⭐
   - Good for very specific needs
   - High maintenance cost
   - Full control but time-intensive

4. **Yeoman** ⭐⭐
   - Overkill for our use case
   - Complex setup
   - Declining community

---

## 3. Fastify Autoload Analysis

### 3.1 What is Fastify Autoload?

Fastify autoload is a plugin that automatically loads and registers Fastify plugins from a directory structure. It's designed to enable file-based routing similar to Express.js or Next.js.

### 3.2 How Fastify Autoload Works

**Basic Setup**:
```typescript
// index.ts
import Fastify from 'fastify'
import autoload from '@fastify/autoload'
import { join } from 'path'

const fastify = Fastify()

// Autoload plugins from directory
fastify.register(autoload, {
  dir: join(__dirname, 'routes'),
  options: { prefix: '/api' }
})

await fastify.listen({ port: 3000 })
```

**File Structure**:
```
routes/
  decisions/
    index.ts          # GET, POST /api/decisions
    _id/
      index.ts        # GET, PATCH, DELETE /api/decisions/:id
      options.ts      # Operations on /api/decisions/:id/options
```

### 3.3 How it Handles File-Based Routing

#### A. Directory to Route Mapping

Fastify autoload converts directory structure to routes:

```
routes/decisions.ts → /api/decisions
routes/decisions/index.ts → /api/decisions
routes/decisions/_id/index.ts → /api/decisions/:id
routes/users/_userId/posts/_postId/index.ts → /api/users/:userId/posts/:postId
```

#### B. Parameter Handling

Dynamic segments use underscore prefix:
```
_id → :id
_userId → :userId
_optionId → :optionId
```

#### C. Plugin-Based Exports

Each file exports a Fastify plugin:

```typescript
// routes/decisions/_id/index.ts
import { FastifyPluginAsync } from 'fastify'

const route: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const { id } = request.params as { id: string }
    // Handle GET /api/decisions/:id
  })

  fastify.patch('/', async (request, reply) => {
    // Handle PATCH /api/decisions/:id
  })

  fastify.delete('/', async (request, reply) => {
    // Handle DELETE /api/decisions/:id
  })
}

export default route
```

### 3.4 Compatibility with Our Architecture

#### ❌ INCOMPATIBILITY 1: Folder Naming Convention

**Our Convention**: `[id]` for dynamic segments
**Fastify Autoload**: `_id` for dynamic segments

**Impact**: Complete folder structure mismatch

**Example**:
```
Our structure:
actions/decisions/[id]/options/[optionId]/patch.action.ts

Fastify autoload expects:
routes/decisions/_id/options/_optionId.ts
```

**Migration Required**: Rename all `[param]` folders to `_param`

#### ❌ INCOMPATIBILITY 2: File Naming Convention

**Our Convention**: Separate files per method
- `get.action.ts`
- `post.action.ts`
- `patch.action.ts`
- `delete.action.ts`

**Fastify Autoload**: All methods in one file
- `index.ts` with multiple `fastify.METHOD()` calls

**Impact**: Complete file organization mismatch

**Example**:
```typescript
// Our current structure
actions/decisions/get.action.ts
actions/decisions/post.action.ts
actions/decisions/[id]/get.action.ts
actions/decisions/[id]/patch.action.ts
actions/decisions/[id]/delete.action.ts

// Fastify autoload expects
routes/decisions/index.ts (with GET and POST)
routes/decisions/_id/index.ts (with GET, PATCH, DELETE)
```

#### ❌ INCOMPATIBILITY 3: Export Pattern

**Our Convention**: Named exports
```typescript
export async function getDecision(request, reply) { }
```

**Fastify Autoload**: Default export of plugin
```typescript
export default async (fastify) => {
  fastify.get('/', handler)
}
```

**Impact**: All action files need restructuring

#### ❌ INCOMPATIBILITY 4: Route Registration

**Our Convention**: Explicit registration in `routes.ts`
```typescript
import { getDecision } from './actions/decisions/[id]/get.action'
fastify.get('/api/decisions/:id', getDecision)
```

**Fastify Autoload**: Implicit registration via file structure

**Impact**:
- Eliminates `routes.ts` (conflicts with our validator)
- Route-action alignment validator becomes irrelevant

#### ⚠️ INCOMPATIBILITY 5: Validation System

**Our Validator**: `validate-route-actions.ts` checks that:
- Every route in `routes.ts` has corresponding action file
- Every action file has corresponding route

**Fastify Autoload**: No `routes.ts` file exists

**Impact**: Route-action alignment validator breaks entirely

#### ❌ INCOMPATIBILITY 6: ESLint Rules

**Our Rule**: Files in `actions/` must end with `.action.ts`
```javascript
'**/src/actions/**/*.ts': '*.action'
```

**Fastify Autoload**: Files are typically `index.ts` or `{resource}.ts`

**Impact**: ESLint rules need complete rewrite

### 3.5 Fastify Autoload Trade-offs

#### Advantages

1. **No Manual Route Registration**
   - Routes automatically registered based on file structure
   - Reduces boilerplate in routes.ts
   - Less maintenance

2. **File-Based Routing**
   - Directory structure mirrors URL structure
   - Easy to find route handlers
   - Similar to Next.js

3. **Plugin Isolation**
   - Each route file is a plugin
   - Better encapsulation
   - Easier testing

#### Disadvantages

1. **Complete Architecture Change**
   - All folders need renaming (`[id]` → `_id`)
   - All files need restructuring (separate → combined)
   - All exports need changing (named → default plugin)

2. **Validation System Breaks**
   - Route-action alignment validator obsolete
   - ESLint rules need rewrite
   - Structure validator needs updates

3. **Less Explicit**
   - No central routes.ts to see all routes
   - Route registration happens implicitly
   - Harder to understand full API surface

4. **Migration Cost**
   - Massive codebase changes required
   - High risk of bugs during migration
   - Significant testing effort

5. **Opinionated Structure**
   - Locked into Fastify autoload conventions
   - Less flexibility for custom patterns
   - Harder to deviate when needed

### 3.6 Can It Work with Our `.action.ts` Convention?

**Technically possible but defeats the purpose**:

```typescript
// routes/decisions/_id/get.action.ts
import { FastifyPluginAsync } from 'fastify'
import { getDecision } from './get.action'

const route: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', getDecision)
}

export default route
```

**Problems**:
- Need wrapper files for each action
- Defeats the purpose of autoload
- More boilerplate, not less
- Awkward structure

### 3.7 Fastify Autoload Summary

**Strengths**:
- Eliminates manual route registration
- File structure mirrors URL structure
- Good for greenfield projects
- Built-in to Fastify ecosystem

**Weaknesses**:
- Incompatible with our folder structure (`[param]` vs `_param`)
- Incompatible with our file structure (separate vs combined)
- Breaks our validation system entirely
- Requires massive migration effort

**Fit for Our Project**: ⭐ (1/5)
- Not recommended due to fundamental incompatibilities
- Migration cost far exceeds benefits
- Would require rewriting entire validation system
- Loss of explicit route registration

---

## 4. Recommendations

### 4.1 Recommended Approach: Plop.js

**Adopt Plop.js for code generation** with the following setup:

#### Implementation Plan

1. **Install Plop.js**
   ```bash
   bun add -d plop
   ```

2. **Create Template Directory**
   ```
   plop-templates/
     action.hbs
     service.hbs
     resource.hbs
   ```

3. **Create plopfile.js** with generators for:
   - Single action generation
   - Service file generation
   - Complete CRUD resource generation

4. **Add Injection Markers** to all `routes.ts` files
   ```typescript
   // PLOP_INJECT_IMPORT
   // PLOP_INJECT_ROUTE
   ```

5. **Integrate Validation**
   - Run ESLint after generation
   - Run route-action validator
   - Fail if validation errors

#### Benefits

- **Reduces Manual Work**: 90% less boilerplate writing
- **Maintains Conventions**: Generated code follows all rules automatically
- **Immediate Validation**: Catches errors during generation
- **Flexible**: Easy to add new generators or modify templates
- **Low Migration Cost**: No changes to existing code structure

#### Estimated Effort

- **Setup**: 4-6 hours
- **Templates**: 2-3 hours
- **Testing**: 2-3 hours
- **Documentation**: 1-2 hours
- **Total**: 1-2 days

### 4.2 NOT Recommended: Fastify Autoload

**Do NOT adopt Fastify autoload** because:

1. **Incompatible Architecture**
   - Requires renaming all `[param]` folders to `_param`
   - Requires combining separate action files into single files
   - Breaks route-action alignment validator

2. **High Migration Cost**
   - Need to refactor entire backend codebase
   - Rewrite validation tools
   - Update all ESLint rules
   - Extensive testing required

3. **Loss of Benefits**
   - Lose explicit route visibility in routes.ts
   - Lose route-action alignment validation
   - Lose naming flexibility

4. **Risk vs Reward**
   - High migration risk
   - Questionable benefits
   - Plop.js provides automation without architecture changes

### 4.3 Alternative: Hygen

If Plop.js doesn't work out, **Hygen is a solid alternative**:

**Pros**:
- Simpler template syntax (EJS vs Handlebars)
- Similar capabilities to Plop
- Good documentation

**Cons**:
- Less powerful modify actions
- More files to maintain
- Smaller community

**When to Choose**:
- Team prefers EJS over Handlebars
- Need very simple generators
- Want file-based template organization

---

## 5. Proof of Concept

### 5.1 Plop.js Implementation Example

#### File: `plopfile.js`

```javascript
module.exports = function (plop) {
  // Helper: Convert route to folder path
  plop.setHelper('routeToFolderPath', function (route) {
    let path = route.replace(/^\/api\//, '')
    return path.replace(/:([a-zA-Z0-9]+)/g, '[$1]')
  })

  // Helper: Extract action name from route
  plop.setHelper('actionName', function (route, method) {
    const segments = route.split('/').filter(s => s && !s.startsWith(':'))
    const resource = segments[segments.length - 1]

    const methodMap = {
      get: segments.length > 2 ? 'get' : 'list',
      post: 'create',
      patch: 'update',
      delete: 'delete',
    }

    return methodMap[method] + resource.charAt(0).toUpperCase() + resource.slice(1)
  })

  // Helper: Extract params from route
  plop.setHelper('extractParams', function (route) {
    const matches = route.match(/:([a-zA-Z0-9]+)/g) || []
    return matches.map(m => m.substring(1))
  })

  // Helper: Check if route has params
  plop.setHelper('hasParams', function (route) {
    return /:/.test(route)
  })

  // Generator: Create single action
  plop.setGenerator('action', {
    description: 'Create a new backend action',
    prompts: [
      {
        type: 'list',
        name: 'service',
        message: 'Which backend service?',
        choices: () => {
          const fs = require('fs')
          const path = require('path')
          const appsDir = path.join(process.cwd(), 'apps')

          return fs.readdirSync(appsDir)
            .filter(dir => dir.startsWith('backend-'))
            .sort()
        },
      },
      {
        type: 'list',
        name: 'method',
        message: 'HTTP method?',
        choices: ['get', 'post', 'patch', 'delete'],
      },
      {
        type: 'input',
        name: 'route',
        message: 'Route path (e.g., /api/decisions/:id/options):',
        validate: (input) => {
          if (!input.startsWith('/api/')) {
            return 'Route must start with /api/'
          }
          if (!/^\/api\/[a-z0-9\-:\/]+$/.test(input)) {
            return 'Route must contain only lowercase letters, numbers, hyphens, colons, and slashes'
          }
          return true
        },
      },
      {
        type: 'confirm',
        name: 'hasBody',
        message: 'Does this action accept a request body?',
        default: (answers) => ['post', 'patch'].includes(answers.method),
        when: (answers) => ['post', 'patch'].includes(answers.method),
      },
      {
        type: 'confirm',
        name: 'updateRoutes',
        message: 'Update routes.ts automatically?',
        default: true,
      },
    ],
    actions: (data) => {
      const actions = []

      // Action 1: Create action file
      actions.push({
        type: 'add',
        path: 'apps/{{service}}/src/actions/{{routeToFolderPath route}}/{{method}}.action.ts',
        templateFile: 'plop-templates/action.hbs',
        data: {
          params: plop.getHelper('extractParams')(data.route),
          hasParams: plop.getHelper('hasParams')(data.route),
          actionName: plop.getHelper('actionName')(data.route, data.method),
        },
      })

      // Action 2: Update routes.ts imports
      if (data.updateRoutes) {
        actions.push({
          type: 'modify',
          path: 'apps/{{service}}/src/routes.ts',
          pattern: /(\/\/ PLOP_INJECT_IMPORT)/gi,
          template: "import { {{camelCase (actionName route method)}} } from './actions/{{routeToFolderPath route}}/{{method}}.action'\n$1",
        })

        // Action 3: Update routes.ts registration
        actions.push({
          type: 'append',
          path: 'apps/{{service}}/src/routes.ts',
          pattern: /(\/\/ PLOP_INJECT_ROUTE)/gi,
          template: "  fastify.{{method}}('{{route}}', {{camelCase (actionName route method)}})",
        })
      }

      // Action 4: Run validation
      actions.push({
        type: 'custom',
        action: async (answers) => {
          const { execSync } = require('child_process')

          console.log('\n📋 Running validation...\n')

          try {
            // Run ESLint
            console.log('1. Running ESLint...')
            execSync(
              `cd apps/${answers.service} && bun run lint`,
              { stdio: 'inherit' }
            )

            // Run route-action validator
            console.log('\n2. Running route-action alignment validator...')
            execSync(
              'bun run scripts/lints/backend/validate-route-actions.ts',
              { stdio: 'inherit' }
            )

            console.log('\n✅ All validations passed!\n')

            return `
╔════════════════════════════════════════════════════════════╗
║                    SUCCESS!                                 ║
╚════════════════════════════════════════════════════════════╝

Created: apps/${answers.service}/src/actions/${plop.getHelper('routeToFolderPath')(answers.route)}/${answers.method}.action.ts
Updated: apps/${answers.service}/src/routes.ts

Next steps:
  1. Implement the action logic
  2. Add tests
  3. Update OpenAPI specification
  4. Test the endpoint

Run: cd apps/${answers.service} && bun run dev
            `.trim()
          } catch (error) {
            throw new Error('❌ Validation failed - please fix errors above')
          }
        },
      })

      return actions
    },
  })

  // Generator: Create complete CRUD resource
  plop.setGenerator('resource', {
    description: 'Create a complete CRUD resource',
    prompts: [
      {
        type: 'list',
        name: 'service',
        message: 'Which backend service?',
        choices: () => {
          const fs = require('fs')
          const path = require('path')
          const appsDir = path.join(process.cwd(), 'apps')

          return fs.readdirSync(appsDir)
            .filter(dir => dir.startsWith('backend-'))
            .sort()
        },
      },
      {
        type: 'input',
        name: 'resource',
        message: 'Resource name (singular, e.g., decision, option):',
        validate: (input) => {
          if (!/^[a-z][a-z0-9]*$/.test(input)) {
            return 'Must be lowercase alphanumeric'
          }
          return true
        },
      },
      {
        type: 'input',
        name: 'basePath',
        message: 'Base path (e.g., /api/decisions, /api/decisions/:id/options):',
        default: (answers) => `/api/${answers.resource}s`,
        validate: (input) => {
          if (!input.startsWith('/api/')) {
            return 'Must start with /api/'
          }
          return true
        },
      },
      {
        type: 'confirm',
        name: 'createService',
        message: 'Create corresponding service file?',
        default: true,
      },
    ],
    actions: (data) => {
      const actions = []
      const resourceId = `${data.resource}Id`

      // Create GET collection (list)
      actions.push({
        type: 'add',
        path: 'apps/{{service}}/src/actions/{{routeToFolderPath basePath}}/get.action.ts',
        templateFile: 'plop-templates/action.hbs',
        data: {
          method: 'get',
          route: data.basePath,
          hasParams: false,
          hasBody: false,
          actionName: `list${data.resource.charAt(0).toUpperCase()}${data.resource.slice(1)}s`,
        },
      })

      // Create POST (create)
      actions.push({
        type: 'add',
        path: 'apps/{{service}}/src/actions/{{routeToFolderPath basePath}}/post.action.ts',
        templateFile: 'plop-templates/action.hbs',
        data: {
          method: 'post',
          route: data.basePath,
          hasParams: false,
          hasBody: true,
          actionName: `create${data.resource.charAt(0).toUpperCase()}${data.resource.slice(1)}`,
        },
      })

      // Create GET single
      actions.push({
        type: 'add',
        path: `apps/{{service}}/src/actions/{{routeToFolderPath basePath}}/[${resourceId}]/get.action.ts`,
        templateFile: 'plop-templates/action.hbs',
        data: {
          method: 'get',
          route: `${data.basePath}/:${resourceId}`,
          hasParams: true,
          hasBody: false,
          params: [resourceId],
          actionName: `get${data.resource.charAt(0).toUpperCase()}${data.resource.slice(1)}`,
        },
      })

      // Create PATCH (update)
      actions.push({
        type: 'add',
        path: `apps/{{service}}/src/actions/{{routeToFolderPath basePath}}/[${resourceId}]/patch.action.ts`,
        templateFile: 'plop-templates/action.hbs',
        data: {
          method: 'patch',
          route: `${data.basePath}/:${resourceId}`,
          hasParams: true,
          hasBody: true,
          params: [resourceId],
          actionName: `update${data.resource.charAt(0).toUpperCase()}${data.resource.slice(1)}`,
        },
      })

      // Create DELETE
      actions.push({
        type: 'add',
        path: `apps/{{service}}/src/actions/{{routeToFolderPath basePath}}/[${resourceId}]/delete.action.ts`,
        templateFile: 'plop-templates/action.hbs',
        data: {
          method: 'delete',
          route: `${data.basePath}/:${resourceId}`,
          hasParams: true,
          hasBody: false,
          params: [resourceId],
          actionName: `delete${data.resource.charAt(0).toUpperCase()}${data.resource.slice(1)}`,
        },
      })

      // Optionally create service file
      if (data.createService) {
        actions.push({
          type: 'add',
          path: 'apps/{{service}}/src/services/{{resource}}.service.ts',
          templateFile: 'plop-templates/service.hbs',
        })
      }

      // Update routes.ts for all actions
      const routes = [
        { method: 'get', route: data.basePath, name: `list${data.resource}s` },
        { method: 'post', route: data.basePath, name: `create${data.resource}` },
        { method: 'get', route: `${data.basePath}/:${resourceId}`, name: `get${data.resource}` },
        { method: 'patch', route: `${data.basePath}/:${resourceId}`, name: `update${data.resource}` },
        { method: 'delete', route: `${data.basePath}/:${resourceId}`, name: `delete${data.resource}` },
      ]

      routes.forEach(({ method, route, name }) => {
        actions.push({
          type: 'modify',
          path: 'apps/{{service}}/src/routes.ts',
          pattern: /(\/\/ PLOP_INJECT_IMPORT)/gi,
          template: `import { ${name} } from './actions/${plop.getHelper('routeToFolderPath')(route)}/${method}.action'\n$1`,
        })

        actions.push({
          type: 'append',
          path: 'apps/{{service}}/src/routes.ts',
          pattern: /(\/\/ PLOP_INJECT_ROUTE)/gi,
          template: `  fastify.${method}('${route}', ${name})`,
        })
      })

      // Run validation
      actions.push({
        type: 'custom',
        action: async (answers) => {
          const { execSync } = require('child_process')

          console.log('\n📋 Running validation...\n')

          try {
            execSync(`cd apps/${answers.service} && bun run lint`, { stdio: 'inherit' })
            execSync('bun run scripts/lints/backend/validate-route-actions.ts', { stdio: 'inherit' })

            return `\n✅ Created complete CRUD resource for ${answers.resource}!\n`
          } catch (error) {
            throw new Error('❌ Validation failed')
          }
        },
      })

      return actions
    },
  })
}
```

#### File: `plop-templates/action.hbs`

```handlebars
import type { FastifyRequest, FastifyReply } from 'fastify'

{{#if hasParams}}
interface {{pascalCase actionName}}Params {
  {{#each params}}
  {{this}}: string
  {{/each}}
}
{{/if}}

{{#if hasBody}}
interface {{pascalCase actionName}}Body {
  // TODO: Define request body interface
  // Example:
  // name: string
  // description?: string
}
{{/if}}

/**
 * {{uppercase method}} {{route}}
 *
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
export async function {{camelCase actionName}}(
  request: FastifyRequest<{
    {{#if hasParams}}Params: {{pascalCase actionName}}Params{{/if}}
    {{#if hasBody}}{{#if hasParams}}, {{/if}}Body: {{pascalCase actionName}}Body{{/if}}
  }>,
  reply: FastifyReply
) {
  try {
    {{#if hasParams}}
    const { {{#each params}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} } = request.params
    {{/if}}
    {{#if hasBody}}
    const body = request.body
    {{/if}}

    // TODO: Implement {{method}} {{route}} logic
    // Example for {{method}}:
    {{#if (eq method 'get')}}
    // 1. Fetch data from database/service
    // 2. Return data
    {{/if}}
    {{#if (eq method 'post')}}
    // 1. Validate body
    // 2. Create resource in database
    // 3. Return created resource with 201 status
    {{/if}}
    {{#if (eq method 'patch')}}
    // 1. Validate body
    // 2. Update resource in database
    // 3. Return updated resource
    {{/if}}
    {{#if (eq method 'delete')}}
    // 1. Check if resource exists
    // 2. Delete resource from database
    // 3. Return 204 No Content
    {{/if}}

    reply.status({{#if (eq method 'post')}}201{{else}}200{{/if}}).send({
      message: 'Not implemented yet',
      {{#if hasParams}}
      params: { {{#each params}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} },
      {{/if}}
    })
  } catch (error: unknown) {
    console.error('Error in {{camelCase actionName}}:', error)
    reply.status(500).send({ error: 'Internal server error' })
  }
}
```

#### File: `plop-templates/service.hbs`

```handlebars
/**
 * Service for {{pascalCase resource}} operations
 *
 * This service handles business logic for {{resource}} resources.
 * It should be imported by action files and should not directly
 * interact with request/reply objects.
 */

// TODO: Import types from ../types or define interfaces here

/**
 * List all {{resource}}s
 */
export async function list{{pascalCase resource}}s() {
  // TODO: Implement database query
  throw new Error('Not implemented')
}

/**
 * Get a single {{resource}} by ID
 */
export async function get{{pascalCase resource}}ById(id: string) {
  // TODO: Implement database query
  throw new Error('Not implemented')
}

/**
 * Create a new {{resource}}
 */
export async function create{{pascalCase resource}}(data: unknown) {
  // TODO: Validate and create {{resource}}
  throw new Error('Not implemented')
}

/**
 * Update a {{resource}}
 */
export async function update{{pascalCase resource}}(id: string, data: unknown) {
  // TODO: Validate and update {{resource}}
  throw new Error('Not implemented')
}

/**
 * Delete a {{resource}}
 */
export async function delete{{pascalCase resource}}(id: string) {
  // TODO: Delete {{resource}}
  throw new Error('Not implemented')
}
```

### 5.2 Usage Examples

#### Example 1: Generate Single Action

```bash
$ bun plop action

? Which backend service? backend-decision
? HTTP method? post
? Route path: /api/decisions/:id/options
? Does this action accept a request body? Yes
? Update routes.ts automatically? Yes

✔ ++ apps/backend-decision/src/actions/decisions/[id]/options/post.action.ts
✔ _+ apps/backend-decision/src/routes.ts
✔ _+ apps/backend-decision/src/routes.ts

📋 Running validation...

1. Running ESLint...
✓ ESLint passed

2. Running route-action alignment validator...
✓ All routes aligned

✅ All validations passed!

╔════════════════════════════════════════════════════════════╗
║                    SUCCESS!                                 ║
╚════════════════════════════════════════════════════════════╝

Created: apps/backend-decision/src/actions/decisions/[id]/options/post.action.ts
Updated: apps/backend-decision/src/routes.ts

Next steps:
  1. Implement the action logic
  2. Add tests
  3. Update OpenAPI specification
  4. Test the endpoint

Run: cd apps/backend-decision && bun run dev
```

#### Example 2: Generate Complete CRUD Resource

```bash
$ bun plop resource

? Which backend service? backend-decision
? Resource name: component
? Base path: /api/decisions/:id/components
? Create corresponding service file? Yes

✔ ++ apps/backend-decision/src/actions/decisions/[id]/components/get.action.ts
✔ ++ apps/backend-decision/src/actions/decisions/[id]/components/post.action.ts
✔ ++ apps/backend-decision/src/actions/decisions/[id]/components/[componentId]/get.action.ts
✔ ++ apps/backend-decision/src/actions/decisions/[id]/components/[componentId]/patch.action.ts
✔ ++ apps/backend-decision/src/actions/decisions/[id]/components/[componentId]/delete.action.ts
✔ ++ apps/backend-decision/src/services/component.service.ts
✔ _+ apps/backend-decision/src/routes.ts (5 imports added)
✔ _+ apps/backend-decision/src/routes.ts (5 routes added)

📋 Running validation...
✅ All validations passed!

✅ Created complete CRUD resource for component!
```

### 5.3 Benefits Demonstrated

1. **Automatic Folder Creation**: Creates nested `[id]` folders automatically
2. **Correct File Naming**: Always creates `{method}.action.ts` files
3. **Route Registration**: Updates routes.ts with imports and route calls
4. **Validation**: Runs ESLint and route-action validator after generation
5. **Consistent Code**: All generated code follows conventions
6. **Time Savings**: Minutes instead of 15-30 minutes per action

---

## 6. Migration Strategy

### 6.1 Phase 1: Setup (Week 1)

#### Day 1-2: Install and Configure

1. Install Plop.js
   ```bash
   bun add -d plop
   ```

2. Create template directory
   ```bash
   mkdir -p plop-templates
   ```

3. Create initial templates
   - `action.hbs`
   - `service.hbs`
   - `resource.hbs`

4. Create `plopfile.js` with basic generators

#### Day 3-4: Add Injection Markers

Update all existing `routes.ts` files to include injection markers:

```typescript
// Before
import type { FastifyInstance } from 'fastify'
import { getDecision } from './actions/decisions/[id]/get.action'

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => ({ status: 'ok' }))
  fastify.get('/api/decisions/:id', getDecision)
}
```

```typescript
// After
import type { FastifyInstance } from 'fastify'
import { getDecision } from './actions/decisions/[id]/get.action'
// PLOP_INJECT_IMPORT

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => ({ status: 'ok' }))

  fastify.get('/api/decisions/:id', getDecision)
  // PLOP_INJECT_ROUTE
}
```

**Services to Update**:
- apps/backend-decision/src/routes.ts
- apps/backend-socket/src/routes.ts
- Any future backend services

#### Day 5: Testing

1. Test action generator
   - Generate single GET action
   - Generate single POST action
   - Generate action in nested route
   - Verify ESLint passes
   - Verify route-action validator passes

2. Test resource generator
   - Generate complete CRUD resource
   - Verify all files created correctly
   - Verify routes.ts updated correctly
   - Run full validation suite

### 6.2 Phase 2: Documentation (Week 1-2)

#### Day 6-7: Write Documentation

Create `documentation/backend/code-generation.md`:
- How to use Plop generators
- Available generators and their options
- Examples for common scenarios
- Troubleshooting guide

Update existing documentation:
- `documentation/backend/README.md` - Add code generation section
- `documentation/backend/checklist.md` - Include Plop in new service checklist

### 6.3 Phase 3: Team Onboarding (Week 2)

#### Week 2: Team Training

1. **Demo Session** (1 hour)
   - Show how to use `bun plop action`
   - Show how to use `bun plop resource`
   - Demonstrate validation integration
   - Q&A

2. **Trial Period** (Rest of week)
   - Team uses Plop for all new actions
   - Gather feedback
   - Make template adjustments
   - Update documentation based on feedback

### 6.4 Phase 4: Expansion (Week 3+)

#### Additional Generators

Based on team needs, create additional generators:

1. **Test Generator**
   - Generate test files for actions
   - Template: `{actionName}.test.ts`

2. **Type Generator**
   - Generate TypeScript interfaces
   - Add to types.ts automatically

3. **OpenAPI Generator**
   - Generate OpenAPI spec entries
   - Update openapi.yaml automatically

4. **Full Service Generator**
   - Generate complete backend service from scratch
   - All required files and structure

### 6.5 Rollback Plan

If Plop.js doesn't work out:

1. **Easy Rollback**
   - Remove injection markers from routes.ts
   - Uninstall Plop.js: `bun remove plop`
   - Delete plop-templates/ directory
   - Delete plopfile.js
   - Continue manual coding

2. **No Risk to Existing Code**
   - Plop only adds code, never modifies existing logic
   - All generated code can be manually edited
   - No lock-in or dependencies

### 6.6 Success Metrics

Track these metrics to measure success:

1. **Time Savings**
   - Before: ~15-30 minutes per action
   - After: ~2-3 minutes per action
   - Target: 80% time reduction

2. **Error Reduction**
   - Before: Manual errors in file naming, imports, etc.
   - After: Zero naming errors
   - Target: 100% convention compliance

3. **Developer Satisfaction**
   - Survey team after 2 weeks
   - Track usage vs manual creation
   - Target: 80% adoption rate

4. **Validation Pass Rate**
   - Track ESLint pass rate on generated code
   - Track route-action alignment on first try
   - Target: 100% pass rate

---

## Conclusion

### Final Recommendations

1. **✅ ADOPT Plop.js**
   - Best fit for our architecture
   - No breaking changes required
   - Significant time savings
   - Integrates with existing validation
   - Low implementation cost

2. **❌ DO NOT ADOPT Fastify Autoload**
   - Fundamentally incompatible with our structure
   - Would break all validation tools
   - High migration cost
   - Questionable benefits

3. **⚠️ CONSIDER Hygen as Fallback**
   - Only if Plop doesn't work
   - Similar capabilities
   - Slightly different approach

### Next Steps

1. Get approval for Plop.js implementation
2. Schedule 1-2 days for setup
3. Create templates and plopfile.js
4. Add injection markers to routes.ts files
5. Document usage
6. Train team
7. Monitor adoption and gather feedback

### Questions for Stakeholders

1. Is the 1-2 day implementation timeline acceptable?
2. Should we start with basic generators or build comprehensive ones?
3. Who should be involved in template design?
4. When would be the best time for team training?
5. Are there any other code generation needs beyond actions?

---

**Document Version**: 1.0
**Last Updated**: 2025-12-08
**Author**: Claude (AI Assistant)
**Review Status**: Pending team review
