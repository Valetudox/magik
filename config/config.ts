import configData from './config.json' with { type: 'json' }

// Menu types
export interface MenuItem {
  ui: string
  icon: string
}

export interface MenuGroup {
  title: string
  icon: string
  items: MenuItem[]
}

// UI config types
export interface UIConfig {
  name: string
  basePath: string
  containerName: string
  dependsOn: string[]
  port: number
  openapiSpec: string
  vitePort: number
  needsSpecs?: boolean
}

// Service config types
export interface ServiceConfig {
  dev: number
  prod: number
  apiRoute: string
  containerName: string
  backendMode?: 'endpoint-only' | 'custom'
}

// Exports
export const MENU = configData.menu as MenuGroup[]
export const UIS = configData.uis as Record<string, UIConfig>
export const SERVICES = configData.services as Record<string, ServiceConfig>

export type ServiceName = keyof typeof SERVICES

export const PORTS = Object.entries(SERVICES).reduce((acc, [key, value]) => {
  acc[key] = { dev: value.dev, prod: value.prod }
  return acc
}, {} as Record<string, { dev: number; prod: number }>)

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
  return Object.entries(SERVICES).reduce((acc, [key, value]) => {
    acc[key] = value[environment]
    return acc
  }, {} as Record<string, number>)
}

export function getAllApiRoutes(): Record<string, string> {
  return Object.entries(SERVICES).reduce((acc, [key, value]) => {
    acc[key] = value.apiRoute
    return acc
  }, {} as Record<string, string>)
}

export function getBackendMode(service: ServiceName): 'endpoint-only' | 'custom' {
  const serviceConfig = SERVICES[service]
  if (!serviceConfig) {
    throw new Error(`Service "${service}" not found in configuration`)
  }
  return serviceConfig.backendMode || 'custom'
}
