// Helper functions
function extractParams(route) {
  const matches = route.match(/:(\w+)/g)
  if (!matches) return []
  return matches.map(match => match.substring(1))
}

function routeToPath(route) {
  return route
    .replace(/^\/api\//, '')
    .replace(/:(\w+)/g, '[$1]')
    .replace(/\/$/, '')
}

// Validation functions
function validateRoute(route) {
  if (!route || route.trim() === '') {
    return 'Route is required'
  }
  if (!route.startsWith('/api/')) {
    return 'Route must start with /api/'
  }
  return true
}

function validateFunctionName(name) {
  if (!name || name.trim() === '') {
    return 'Function name is required'
  }
  if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
    return 'Function name must be in camelCase'
  }
  return true
}

module.exports = {
  prompt: ({ prompter, args }) => {
    // If arguments are provided, use them directly (for AI agents)
    if (args.serviceName && args.route && args.method && args.functionName) {
      // Validate arguments
      const routeValidation = validateRoute(args.route)
      if (routeValidation !== true) {
        throw new Error(routeValidation)
      }

      const functionNameValidation = validateFunctionName(args.functionName)
      if (functionNameValidation !== true) {
        throw new Error(functionNameValidation)
      }

      const params = extractParams(args.route)
      const actionPath = routeToPath(args.route)

      return Promise.resolve({
        serviceName: args.serviceName,
        route: args.route,
        method: args.method,
        functionName: args.functionName,
        params,
        actionPath,
        hasParams: params.length > 0
      })
    }

    // Interactive prompts
    return prompter
      .prompt([
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
          type: 'select',
          name: 'method',
          message: 'HTTP method:',
          choices: ['get', 'post', 'patch', 'delete', 'put'],
          initial: 'get'
        },
        {
          type: 'input',
          name: 'functionName',
          message: 'Function name (e.g., getDecision, createDecision):',
          validate: validateFunctionName
        }
      ])
      .then(answers => {
        const params = extractParams(answers.route)
        const actionPath = routeToPath(answers.route)

        return {
          ...answers,
          params,
          actionPath,
          hasParams: params.length > 0
        }
      })
  }
}
