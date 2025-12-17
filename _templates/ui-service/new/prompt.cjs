// Validation functions
function validateServiceName(name) {
  if (!name || name.trim() === '') {
    return 'Service name is required'
  }
  if (!/^[a-z]+(-[a-z]+)*$/.test(name)) {
    return 'Service name must be in kebab-case (lowercase with hyphens)'
  }
  return true
}

function validateBasePath(path) {
  if (!path || path.trim() === '') {
    return 'Base path is required'
  }
  if (!path.startsWith('/')) {
    return 'Base path must start with /'
  }
  if (!/^\/[a-z]+(-[a-z]+)*$/.test(path)) {
    return 'Base path must be /lowercase-with-hyphens'
  }
  return true
}

function validatePort(port) {
  const num = parseInt(port)
  if (isNaN(num)) {
    return 'Port must be a number'
  }
  if (num < 1024 || num < 65535) {
    return 'Port must be between 1024 and 65535'
  }
  return true
}

function validateDependencies(deps) {
  if (!deps || deps.trim() === '') {
    return 'At least one dependency is required'
  }
  const depsArray = deps.split(',').map(d => d.trim())
  for (const dep of depsArray) {
    if (!/^backend-[a-z]+(-[a-z]+)*$/.test(dep)) {
      return `Invalid dependency: ${dep}. Must be in format backend-name`
    }
  }
  return true
}

module.exports = {
  prompt: ({ prompter, args }) => {
    // If arguments are provided, use them directly (for AI agents)
    if (args.serviceName && args.basePath) {
      // Validate arguments
      const serviceNameValidation = validateServiceName(args.serviceName)
      if (serviceNameValidation !== true) {
        throw new Error(serviceNameValidation)
      }

      const basePathValidation = validateBasePath(args.basePath)
      if (basePathValidation !== true) {
        throw new Error(basePathValidation)
      }

      if (args.vitePort) {
        const portValidation = validatePort(args.vitePort)
        if (portValidation !== true) {
          throw new Error(portValidation)
        }
      }

      const dependsOn = args.dependsOn || `backend-${args.serviceName},backend-socket`
      const depsArray = typeof dependsOn === 'string'
        ? dependsOn.split(',').map(d => d.trim())
        : dependsOn

      return Promise.resolve({
        serviceName: args.serviceName,
        basePath: args.basePath,
        containerName: args.containerName || `ui-${args.serviceName}`,
        dependsOn: depsArray,
        vitePort: args.vitePort || 5173,
        needsSpecs: args.needsSpecs || false,
        openapiSpec: args.openapiSpec || `specs/domains/${args.serviceName}/openapi.yaml`
      })
    }

    // Interactive prompts
    return prompter
      .prompt([
        {
          type: 'input',
          name: 'serviceName',
          message: 'Service name (e.g., decision, audio, specification):',
          validate: validateServiceName
        },
        {
          type: 'input',
          name: 'basePath',
          message: 'Base path (e.g., /decisions, /audio):',
          initial: (prev) => `/${prev.serviceName}s`,
          validate: validateBasePath
        },
        {
          type: 'input',
          name: 'vitePort',
          message: 'Vite dev server port:',
          initial: '5173',
          validate: validatePort
        },
        {
          type: 'input',
          name: 'dependsOn',
          message: 'Backend dependencies (comma-separated):',
          initial: (prev) => `backend-${prev.serviceName},backend-socket`,
          validate: validateDependencies
        },
        {
          type: 'confirm',
          name: 'needsSpecs',
          message: 'Does this UI need specs folder copied during build?',
          initial: false
        }
      ])
      .then(answers => ({
        ...answers,
        containerName: `ui-${answers.serviceName}`,
        dependsOn: answers.dependsOn.split(',').map(d => d.trim()),
        openapiSpec: `specs/domains/${answers.serviceName}/openapi.yaml`
      }))
  }
}
