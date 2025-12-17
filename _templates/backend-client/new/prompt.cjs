module.exports = {
  prompt: ({ prompter, args }) => {
    // If arguments are provided, use them directly
    if (args.domain && args.openapiPath) {
      return Promise.resolve({
        domain: args.domain,
        openapiPath: args.openapiPath,
      })
    }

    // Interactive prompts
    return prompter.prompt([
      {
        type: 'input',
        name: 'domain',
        message: 'Domain name (e.g., audio, specification):',
        validate: (value) => {
          if (/.+/.test(value)) return true
          return 'Domain name is required'
        },
      },
      {
        type: 'input',
        name: 'openapiPath',
        message: 'OpenAPI spec path:',
        validate: (value) => {
          if (/.+/.test(value)) return true
          return 'OpenAPI spec path is required'
        },
      },
    ])
  },
}
