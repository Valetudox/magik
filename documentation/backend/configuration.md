# Configuration Files

## eslint.config.js

MUST extend the base ESLint configuration:

```javascript
import baseConfig from '../../eslint.config.base.js'

export default baseConfig
```

## tsconfig.json

MUST extend the base TypeScript configuration:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## package.json

MUST include the following structure:

```json
{
  "name": "backend-{service-name}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write src",
    "format:check": "prettier --check src"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "fastify": "^5.2.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2"
  }
}
```

### Required Scripts
- `dev` - Run development server with file watching
- `start` - Run production server
- `lint` - Run ESLint with zero warnings allowed
- `lint:fix` - Run ESLint with auto-fix
- `format` - Format code with Prettier
- `format:check` - Check code formatting

### Required Dependencies
- `@fastify/cors` - CORS support
- `fastify` - Web framework

### Required Dev Dependencies
- `@types/node` - Node.js type definitions

## Port Configuration

All backend services MUST obtain the port through `config.ts`, which uses the centralized port configuration system.

The port MUST be defined in `config.ts`:

```typescript
import { getPort } from '../../../config/config'

export const PORT = getPort('BACKEND_{SERVICE}')
```

All other files MUST import the port from `config.ts`:

```typescript
import { PORT } from './config'
```

Service port identifiers follow the pattern: `BACKEND_{SERVICE_NAME}`

Examples:
- `BACKEND_AUDIO`
- `BACKEND_DECISION`
- `BACKEND_SPECIFICATION`
- `BACKEND_SOCKET`
