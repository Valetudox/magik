---
to: packages/backend-<%= domain %>-client/package.json
---
{
  "name": "@magik/backend-<%= domain %>-client",
  "version": "1.0.0",
  "description": "Generated TypeScript client for Backend <%= h.changeCase.pascalCase(domain) %> API",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./client.gen": "./src/client.gen.ts",
    "./types.gen": "./src/types.gen.ts",
    "./sdk.gen": "./src/sdk.gen.ts"
  },
  "scripts": {
    "generate": "openapi-ts -i ../../<%= openapiPath %> -o ./src -c @hey-api/client-fetch",
    "lint": "eslint src --max-warnings 0"
  },
  "peerDependencies": {
    "@hey-api/client-fetch": "^0.4.0"
  },
  "devDependencies": {
    "typescript": "~5.9.3"
  }
}
