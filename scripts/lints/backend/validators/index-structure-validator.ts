import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidationResult } from './types';

// Helper to get service display name from container name
function getServiceDisplayName(containerName: string): string {
  // Remove "backend-" prefix
  const name = containerName.replace(/^backend-/, '');
  // Capitalize first letter of each word (handle hyphenated names)
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to check if service is endpoint-only mode
function isEndpointOnly(serviceName: string, rootDir: string): boolean {
  try {
    const configPath = join(rootDir, 'config', 'config.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Convert service name to config key (backend-audio -> BACKEND_AUDIO)
    const serviceKey = serviceName.toUpperCase().replace(/-/g, '_');
    const backendMode = config.services?.[serviceKey]?.backendMode || 'custom';

    return backendMode === 'endpoint-only';
  } catch (error) {
    console.error(`Error reading config for ${serviceName}:`, error);
    return false;
  }
}

// Helper to get container name from config
function getContainerName(serviceName: string, rootDir: string): string {
  try {
    const configPath = join(rootDir, 'config', 'config.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Convert service name to config key (backend-audio -> BACKEND_AUDIO)
    const serviceKey = serviceName.toUpperCase().replace(/-/g, '_');
    return config.services?.[serviceKey]?.containerName || serviceName;
  } catch (error) {
    console.error(`Error reading container name for ${serviceName}:`, error);
    return serviceName;
  }
}

// Main validation function
export function validateIndexStructure(
  serviceName: string,
  servicePath: string,
  rootDir?: string
): ValidationResult {
  const errors: string[] = [];

  // Determine root dir if not provided
  const actualRootDir = rootDir || join(servicePath, '..', '..');

  // Check if service is endpoint-only mode
  if (!isEndpointOnly(serviceName, actualRootDir)) {
    // Service is in custom mode, skip validation
    return {
      success: true,
      output: `Service ${serviceName} is in 'custom' mode (skipping index.ts structure validation)`,
    };
  }

  // Get the index.ts file path
  const indexPath = join(servicePath, 'src', 'index.ts');

  if (!existsSync(indexPath)) {
    errors.push(`index.ts not found at ${indexPath}`);
    return { success: false, errors };
  }

  // Read the file content
  const content = readFileSync(indexPath, 'utf-8');

  // Remove comments for structural validation
  const contentNoComments = content
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  // Get container name for log message validation
  const containerName = getContainerName(serviceName, actualRootDir);
  const serviceDisplayName = getServiceDisplayName(containerName);

  // Required imports (exact matches)
  const requiredImports = [
    "import cors from '@fastify/cors'",
    "import Fastify from 'fastify'",
    "import { PORT } from './config'",
    "import { registerRoutes } from './routes'",
  ];

  // Check for required imports
  for (const importLine of requiredImports) {
    if (!content.includes(importLine)) {
      errors.push(`Missing required import: ${importLine}`);
    }
  }

  // Check for extra imports
  const importRegex = /^import\s+.*$/gm;
  const imports = content.match(importRegex) || [];
  for (const importLine of imports) {
    // Check if this import line matches any required import
    const isRequired = requiredImports.some(req => {
      // Normalize both by removing quotes and extra spaces
      const normalized = importLine.trim().replace(/["']/g, '');
      const normalizedReq = req.trim().replace(/["']/g, '');
      return normalized === normalizedReq;
    });

    if (!isRequired) {
      errors.push(`Extra import found: ${importLine}`);
    }
  }

  // Check for async function start()
  if (!contentNoComments.includes('async function start()')) {
    errors.push("Missing 'async function start()' declaration");
  }

  // Check for void start()
  if (!contentNoComments.includes('void start()')) {
    errors.push("Missing 'void start()' invocation");
  }

  // Check for required structure elements
  if (!contentNoComments.includes('const fastify = Fastify')) {
    errors.push("Missing 'const fastify = Fastify' initialization");
  }

  if (!contentNoComments.includes('logger: true')) {
    errors.push("Missing 'logger: true' in Fastify config");
  }

  if (!contentNoComments.includes('await fastify.register(cors')) {
    errors.push("Missing CORS registration: 'await fastify.register(cors'");
  }

  if (!contentNoComments.includes('registerRoutes(fastify)')) {
    errors.push("Missing 'registerRoutes(fastify)' call");
  }

  if (!contentNoComments.includes("await fastify.listen({ port: PORT, host: '0.0.0.0' })")) {
    errors.push("Missing standard listen call: 'await fastify.listen({ port: PORT, host: '0.0.0.0' })'");
  }

  // Check log message format
  const expectedLog = `Backend ${serviceDisplayName} API running at http://localhost:\${PORT}`;
  const expectedLogLine = `fastify.log.info(\`${expectedLog}\`)`;

  if (!content.includes(expectedLogLine)) {
    errors.push('Log message incorrect');
    errors.push(`  Expected: fastify.log.info(\`${expectedLog}\`)`);

    // Try to find what log message is actually there
    const logMatch = content.match(/fastify\.log\.info\([^)]+\)/);
    if (logMatch) {
      errors.push(`  Got: ${logMatch[0]}`);
    }
  }

  // Check for error handling
  if (!contentNoComments.includes('fastify.log.error(err)')) {
    errors.push("Missing error logging: 'fastify.log.error(err)'");
  }

  if (!contentNoComments.includes('process.exit(1)')) {
    errors.push("Missing 'process.exit(1)' in error handler");
  }

  // Check for forbidden patterns
  const forbiddenPatterns = ['setupFileWatcher', 'Socket.IO', 'setupWatcher'];
  for (const pattern of forbiddenPatterns) {
    if (content.includes(pattern)) {
      errors.push(`Contains custom initialization code (${pattern})`);
      errors.push("  Either remove custom code or change backendMode to 'custom' in config.json");
      break;
    }
  }

  // Check for dynamic port resolution
  if (content.includes('getPort(')) {
    errors.push("Uses dynamic port resolution (getPort) - should import PORT from ./config");
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors: [
        `Service ${serviceName} violates endpoint-only structure requirements:`,
        ...errors,
        '',
        "This service is configured as 'endpoint-only' and must follow the standard structure.",
        "Either fix the index.ts to match the standard, or change backendMode to 'custom' in config.json.",
      ],
    };
  }

  return {
    success: true,
    output: `Service ${serviceName} follows the endpoint-only structure`,
  };
}
