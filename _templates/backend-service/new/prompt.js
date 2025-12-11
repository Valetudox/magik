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

function validatePort(port) {
  const num = parseInt(port)
  if (isNaN(num)) {
    return 'Port must be a number'
  }
  if (num < 1 || num > 65535) {
    return 'Port must be between 1 and 65535'
  }
  return true
}

module.exports = {
  prompt: ({ prompter, args }) => {
    // If arguments are provided, use them directly (for AI agents)
    if (args.serviceName && args.port) {
      // Validate arguments
      const serviceNameValidation = validateServiceName(args.serviceName)
      if (serviceNameValidation !== true) {
        throw new Error(serviceNameValidation)
      }

      const portValidation = validatePort(args.port)
      if (portValidation !== true) {
        throw new Error(portValidation)
      }

      return Promise.resolve({
        serviceName: args.serviceName,
        port: args.port,
        description: args.description || `${args.serviceName} service`
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
          name: 'port',
          message: 'Port number:',
          initial: '4000',
          validate: validatePort
        },
        {
          type: 'input',
          name: 'description',
          message: 'Service description:',
          initial: (prev) => `${prev.serviceName} service`
        }
      ])
  }
}
