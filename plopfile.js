import path from 'path'
import { fileURLToPath } from 'url'
import { extractParams, routeToPath, calculateImportDepth, hasParams } from './generators/helpers/route-parser.js'
import { camelCase, pascalCase, upperCase, contains } from './generators/helpers/string-helpers.js'
import { validateServiceName, validatePort, validateRoute, validateFunctionName } from './generators/helpers/validators.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function (plop) {
  // Set the base path for templates
  plop.setDefaultInclude({ generators: true })

  // Load custom helpers
  plop.setHelper('importPath', function(depth) {
    return '../'.repeat(depth || 0)
  })

  plop.setHelper('routeToPath', routeToPath)
  plop.setHelper('extractParams', extractParams)
  plop.setHelper('calculateImportDepth', calculateImportDepth)
  plop.setHelper('hasParams', hasParams)
  plop.setHelper('camelCase', camelCase)
  plop.setHelper('pascalCase', pascalCase)
  plop.setHelper('uppercase', upperCase)
  plop.setHelper('contains', contains)

  // Add date helper
  plop.setHelper('date', function() {
    return new Date().toISOString().split('T')[0]
  })

  // Add eq and or helpers for conditionals
  plop.setHelper('eq', function(a, b) {
    return a === b
  })

  plop.setHelper('or', function(a, b) {
    return a || b
  })

  // Backend Service Generator
  plop.setGenerator('backend-service', {
    description: 'Generate a new backend service with all required files',
    prompts: [
      {
        type: 'input',
        name: 'serviceName',
        message: 'Service name (e.g., decision, audio, specification):',
        validate: validateServiceName
      },
      {
        type: 'input',
        name: 'port',
        message: 'Port number:',
        default: '4000',
        validate: validatePort
      },
      {
        type: 'input',
        name: 'description',
        message: 'Service description:',
        default: (answers) => `${answers.serviceName} service`
      }
    ],
    actions: [
      // Create directory structure
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/src/index.ts',
        templateFile: 'generators/templates/backend-service/src/index.ts.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/src/routes.ts',
        templateFile: 'generators/templates/backend-service/src/routes.ts.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/src/actions/.gitkeep',
        templateFile: 'generators/templates/backend-service/src/actions/.gitkeep.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/src/services/.gitkeep',
        templateFile: 'generators/templates/backend-service/src/services/.gitkeep.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/package.json',
        templateFile: 'generators/templates/backend-service/package.json.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/tsconfig.json',
        templateFile: 'generators/templates/backend-service/tsconfig.json.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/eslint.config.js',
        templateFile: 'generators/templates/backend-service/eslint.config.js.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/Dockerfile',
        templateFile: 'generators/templates/backend-service/Dockerfile.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/openapi.yaml',
        templateFile: 'generators/templates/backend-service/openapi.yaml.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/.gitignore',
        templateFile: 'generators/templates/backend-service/.gitignore.hbs'
      }
    ]
  })

  // API Action Generator
  plop.setGenerator('api-action', {
    description: 'Generate an API action file',
    prompts: [
      {
        type: 'input',
        name: 'serviceName',
        message: 'Backend service name (e.g., decision, audio):',
        validate: (value) => {
          if (/.+/.test(value)) return true
          return 'Service name is required'
        }
      },
      {
        type: 'input',
        name: 'route',
        message: 'API route (e.g., /api/decisions/:id):',
        validate: validateRoute
      },
      {
        type: 'list',
        name: 'method',
        message: 'HTTP method:',
        choices: ['get', 'post', 'patch', 'delete', 'put'],
        default: 'get'
      },
      {
        type: 'input',
        name: 'functionName',
        message: 'Function name (e.g., getDecision, createDecision):',
        validate: validateFunctionName
      }
    ],
    actions: (data) => {
      // Calculate the action path
      const actionPath = data.route
        .replace(/^\/api\//, '')
        .replace(/:(\w+)/g, '[$1]')
        .split('/')
        .join('/')

      return [
        {
          type: 'add',
          path: `apps/backend-{{serviceName}}/src/actions/${actionPath}/{{method}}.action.ts`,
          templateFile: 'generators/templates/api-action/action.ts.hbs'
        }
      ]
    }
  })

}
