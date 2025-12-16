---
to: apps/backend-<%= serviceName %>/src/config.ts
---
import { getPort } from '../../../config/config.js'

export const PORT = getPort('BACKEND_<%= serviceName.toUpperCase().replace(/-/g, '_') %>')
