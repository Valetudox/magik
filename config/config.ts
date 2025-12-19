import configData from './config.json' with { type: 'json' }
import {
  configSchema,
  type Config,
  type MenuItem,
  type MenuGroup,
  type UIConfig,
  type ServiceConfig,
} from './config.schema'

// Re-export types and schemas
export * from './config.schema'

// Parse and validate config
const parsedConfig: Config = configSchema.parse(configData)

// Exports
export const MENU = parsedConfig.menu
export const UIS = parsedConfig.uis
export const SERVICES = parsedConfig.services

export type ServiceName = keyof typeof SERVICES

export const PORTS = Object.entries(SERVICES).reduce(
  (acc, [key, value]) => {
    acc[key] = { dev: value.dev, prod: value.prod }
    return acc
  },
  {} as Record<string, { dev: number; prod: number }>
)

export function getPort(service: ServiceName): number {
  const serviceConfig = SERVICES[service]
  if (!serviceConfig) {
    throw new Error(`Service "${service}" not found in configuration`)
  }

  const env = process.env.NODE_ENV || 'development'
  const isDev = env === 'development'

  const envPort = process.env.PORT
  if (envPort) {
    return Number(envPort)
  }

  return isDev ? serviceConfig.dev : serviceConfig.prod
}

export function getApiRoute(service: ServiceName): string {
  const serviceConfig = SERVICES[service]
  if (!serviceConfig) {
    throw new Error(`Service "${service}" not found in configuration`)
  }
  return serviceConfig.apiRoute
}

export function getContainerName(service: ServiceName): string {
  const serviceConfig = SERVICES[service]
  if (!serviceConfig) {
    throw new Error(`Service "${service}" not found in configuration`)
  }
  return serviceConfig.containerName
}

export function getServiceConfig(service: ServiceName): ServiceConfig {
  const serviceConfig = SERVICES[service]
  if (!serviceConfig) {
    throw new Error(`Service "${service}" not found in configuration`)
  }
  return serviceConfig
}

export function getAllPorts(environment: 'dev' | 'prod' = 'dev'): Record<string, number> {
  return Object.entries(SERVICES).reduce(
    (acc, [key, value]) => {
      acc[key] = value[environment]
      return acc
    },
    {} as Record<string, number>
  )
}

export function getAllApiRoutes(): Record<string, string> {
  return Object.entries(SERVICES).reduce(
    (acc, [key, value]) => {
      acc[key] = value.apiRoute
      return acc
    },
    {} as Record<string, string>
  )
}

export function getBackendMode(service: ServiceName): 'endpoint-only' | 'custom' {
  const serviceConfig = SERVICES[service]
  if (!serviceConfig) {
    throw new Error(`Service "${service}" not found in configuration`)
  }
  return serviceConfig.backendMode || 'custom'
}
