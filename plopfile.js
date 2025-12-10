import path from 'path'
import { fileURLToPath } from 'url'
import { extractParams, routeToPath, calculateImportDepth, hasParams } from './plop-helpers/route-parser.js'
import { camelCase, pascalCase, upperCase, contains } from './plop-helpers/string-helpers.js'
import { validateServiceName, validatePort, validateRoute, validateFunctionName } from './plop-helpers/validators.js'

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
        templateFile: 'plop-templates/backend-service/src/index.ts.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/src/routes.ts',
        templateFile: 'plop-templates/backend-service/src/routes.ts.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/src/actions/.gitkeep',
        templateFile: 'plop-templates/backend-service/src/actions/.gitkeep.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/src/services/.gitkeep',
        templateFile: 'plop-templates/backend-service/src/services/.gitkeep.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/package.json',
        templateFile: 'plop-templates/backend-service/package.json.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/tsconfig.json',
        templateFile: 'plop-templates/backend-service/tsconfig.json.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/eslint.config.js',
        templateFile: 'plop-templates/backend-service/eslint.config.js.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/Dockerfile',
        templateFile: 'plop-templates/backend-service/Dockerfile.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/openapi.yaml',
        templateFile: 'plop-templates/backend-service/openapi.yaml.hbs'
      },
      {
        type: 'add',
        path: 'apps/backend-{{serviceName}}/.gitignore',
        templateFile: 'plop-templates/backend-service/.gitignore.hbs'
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
          templateFile: 'plop-templates/api-action/action.ts.hbs'
        }
      ]
    }
  })

  // ESLint Rule Generator
  plop.setGenerator('eslint-rule', {
    description: 'Generate an ESLint rule with tests',
    prompts: [
      {
        type: 'input',
        name: 'ruleName',
        message: 'Rule name (kebab-case, e.g., no-console-log):',
        validate: (value) => {
          if (/^[a-z]+(-[a-z]+)*$/.test(value)) return true
          return 'Rule name must be in kebab-case'
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Rule description:',
        validate: (value) => {
          if (/.+/.test(value)) return true
          return 'Description is required'
        }
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'eslint-rules/{{ruleName}}.js',
        templateFile: 'plop-templates/eslint-rule/rule.js.hbs'
      },
      {
        type: 'add',
        path: 'eslint-rules/tests/{{ruleName}}.test.js',
        templateFile: 'plop-templates/eslint-rule/test.js.hbs'
      }
    ]
  })

  // Documentation Generator
  plop.setGenerator('documentation', {
    description: 'Generate standardized markdown documentation',
    prompts: [
      {
        type: 'list',
        name: 'docType',
        message: 'Documentation type:',
        choices: ['backend', 'frontend', 'api', 'architecture', 'guide'],
        default: 'guide'
      },
      {
        type: 'input',
        name: 'title',
        message: 'Document title:',
        validate: (value) => {
          if (/.+/.test(value)) return true
          return 'Title is required'
        }
      },
      {
        type: 'input',
        name: 'filename',
        message: 'Filename (without .md):',
        validate: (value) => {
          if (/.+/.test(value)) return true
          return 'Filename is required'
        }
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'documentation/{{docType}}/{{filename}}.md',
        templateFile: 'plop-templates/documentation/doc.md.hbs'
      }
    ]
  })

  // Validation Script Generator
  plop.setGenerator('validation-script', {
    description: 'Generate a validation/lint script',
    prompts: [
      {
        type: 'input',
        name: 'scriptName',
        message: 'Script name (e.g., validate-routes, check-imports):',
        validate: (value) => {
          if (/.+/.test(value)) return true
          return 'Script name is required'
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Script description:',
        validate: (value) => {
          if (/.+/.test(value)) return true
          return 'Description is required'
        }
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'scripts/lints/{{scriptName}}.sh',
        templateFile: 'plop-templates/validation-script/script.sh.hbs'
      }
    ]
  })
}
