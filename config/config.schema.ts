import { z } from 'zod'

// Menu schemas
export const menuItemSchema = z.object({
  ui: z.string(),
  icon: z.string(),
})

export const menuGroupSchema = z.object({
  title: z.string(),
  icon: z.string(),
  items: z.array(menuItemSchema),
})

// UI config schema
export const uiConfigSchema = z.object({
  name: z.string(),
  basePath: z.string(),
  containerName: z.string(),
  dependsOn: z.array(z.string()),
  port: z.number(),
  openapiSpec: z.string(),
  vitePort: z.number(),
  needsSpecs: z.boolean().optional(),
})

// Service config schema
export const serviceConfigSchema = z.object({
  dev: z.number(),
  prod: z.number(),
  apiRoute: z.string(),
  containerName: z.string(),
  backendMode: z.enum(['endpoint-only', 'custom']),
  dataFolders: z.array(z.string()).optional(),
})

// Full config schema (without cross-validation)
const baseConfigSchema = z.object({
  menu: z.array(menuGroupSchema),
  services: z.record(z.string(), serviceConfigSchema),
  uis: z.record(z.string(), uiConfigSchema),
})

// Helper to find duplicates
function findDuplicates<T>(values: T[]): T[] {
  const seen = new Set<T>()
  const duplicates = new Set<T>()
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
    }
    seen.add(value)
  }
  return Array.from(duplicates)
}

// Full config schema with cross-validation
export const configSchema = baseConfigSchema.superRefine((config, ctx) => {
  const serviceEntries = Object.entries(config.services)
  const uiEntries = Object.entries(config.uis)

  // === Services validations ===

  // dev ports must be unique
  const devPorts = serviceEntries.map(([, s]) => s.dev)
  const duplicateDevPorts = findDuplicates(devPorts)
  if (duplicateDevPorts.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate dev ports in services: ${duplicateDevPorts.join(', ')}`,
      path: ['services'],
    })
  }

  // prod ports must be unique
  const prodPorts = serviceEntries.map(([, s]) => s.prod)
  const duplicateProdPorts = findDuplicates(prodPorts)
  if (duplicateProdPorts.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate prod ports in services: ${duplicateProdPorts.join(', ')}`,
      path: ['services'],
    })
  }

  // apiRoute must be unique
  const apiRoutes = serviceEntries.map(([, s]) => s.apiRoute)
  const duplicateApiRoutes = findDuplicates(apiRoutes)
  if (duplicateApiRoutes.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate apiRoutes in services: ${duplicateApiRoutes.join(', ')}`,
      path: ['services'],
    })
  }

  // containerName must be unique in services
  const serviceContainerNames = serviceEntries.map(([, s]) => s.containerName)
  const duplicateServiceContainers = findDuplicates(serviceContainerNames)
  if (duplicateServiceContainers.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate containerNames in services: ${duplicateServiceContainers.join(', ')}`,
      path: ['services'],
    })
  }

  // === UIs validations ===

  // name must be unique
  const uiNames = uiEntries.map(([, u]) => u.name)
  const duplicateNames = findDuplicates(uiNames)
  if (duplicateNames.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate names in uis: ${duplicateNames.join(', ')}`,
      path: ['uis'],
    })
  }

  // basePath must be unique
  const basePaths = uiEntries.map(([, u]) => u.basePath)
  const duplicateBasePaths = findDuplicates(basePaths)
  if (duplicateBasePaths.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate basePaths in uis: ${duplicateBasePaths.join(', ')}`,
      path: ['uis'],
    })
  }

  // containerName must be unique in uis
  const uiContainerNames = uiEntries.map(([, u]) => u.containerName)
  const duplicateUiContainers = findDuplicates(uiContainerNames)
  if (duplicateUiContainers.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate containerNames in uis: ${duplicateUiContainers.join(', ')}`,
      path: ['uis'],
    })
  }

  // vitePort must be unique
  const vitePorts = uiEntries.map(([, u]) => u.vitePort)
  const duplicateVitePorts = findDuplicates(vitePorts)
  if (duplicateVitePorts.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate vitePorts in uis: ${duplicateVitePorts.join(', ')}`,
      path: ['uis'],
    })
  }

  // dependsOn must reference valid service containerNames
  const validServiceContainers = new Set(serviceContainerNames)
  uiEntries.forEach(([uiKey, ui]) => {
    ui.dependsOn.forEach((dep, depIndex) => {
      if (!validServiceContainers.has(dep)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `UI "${uiKey}" dependsOn references unknown service container "${dep}". Valid containers are: ${serviceContainerNames.join(', ')}`,
          path: ['uis', uiKey, 'dependsOn', depIndex],
        })
      }
    })
  })

  // === Menu validations ===

  // menu.items.ui must reference valid UI keys
  const validUiKeys = Object.keys(config.uis)
  config.menu.forEach((group, groupIndex) => {
    group.items.forEach((item, itemIndex) => {
      if (!validUiKeys.includes(item.ui)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Menu item references unknown UI "${item.ui}". Valid UI keys are: ${validUiKeys.join(', ')}`,
          path: ['menu', groupIndex, 'items', itemIndex, 'ui'],
        })
      }
    })
  })
})

// Export types inferred from schemas
export type MenuItem = z.infer<typeof menuItemSchema>
export type MenuGroup = z.infer<typeof menuGroupSchema>
export type UIConfig = z.infer<typeof uiConfigSchema>
export type ServiceConfig = z.infer<typeof serviceConfigSchema>
export type Config = z.infer<typeof configSchema>
