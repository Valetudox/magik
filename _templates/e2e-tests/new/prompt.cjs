module.exports = {
  prompt: ({ prompter, args }) => {
    // If arguments are provided, use them directly
    if (args.domain && args.serviceName && args.port && args.openapiPath) {
      return Promise.resolve({
        domain: args.domain,
        serviceName: args.serviceName,
        port: args.port,
        openapiPath: args.openapiPath,
      })
    }

    // Interactive prompts
    return prompter.prompt([
      {
        type: 'input',
        name: 'domain',
        message: 'Domain name (e.g., audio):',
        validate: (value) => (/.+/.test(value) ? true : 'Domain is required'),
      },
      {
        type: 'input',
        name: 'serviceName',
        message: 'Service name (e.g., backend-audio):',
        validate: (value) => (/.+/.test(value) ? true : 'Service name is required'),
      },
      {
        type: 'input',
        name: 'port',
        message: 'Production port:',
        validate: (value) => (!isNaN(Number(value)) ? true : 'Port must be a number'),
      },
      {
        type: 'input',
        name: 'openapiPath',
        message: 'OpenAPI spec path:',
        validate: (value) => (/.+/.test(value) ? true : 'OpenAPI path is required'),
      },
    ])
  },
}
