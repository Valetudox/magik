import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as ejs from 'ejs';
import type { ValidationResult } from './types';

interface Config {
  services: Record<string, {
    dev: number;
    prod: number;
    apiRoute: string;
    containerName: string;
    backendMode: string;
    dataFolders: string[];
  }>;
}

/**
 * Validates that a backend service's Dockerfile matches the template
 */
export function validateDockerfile(
  serviceName: string,
  servicePath: string
): ValidationResult {
  const errors: string[] = [];

  try {
    // Read the actual Dockerfile
    const dockerfilePath = join(servicePath, 'Dockerfile');
    const actualDockerfile = readFileSync(dockerfilePath, 'utf-8');

    // Read the template
    const templatePath = resolve(
      servicePath,
      '../..',
      '_templates/backend-service/new/Dockerfile.ejs.t'
    );
    let template = readFileSync(templatePath, 'utf-8');

    // Remove frontmatter (first 3 lines: ---, to: ..., ---)
    const lines = template.split('\n');
    template = lines.slice(3).join('\n');

    // Get service name from directory (backend-xxx -> xxx)
    const domain = serviceName.replace(/^backend-/, '');

    // Read config to get port
    const configPath = resolve(servicePath, '../..', 'config/config.json');
    const config: Config = JSON.parse(readFileSync(configPath, 'utf-8'));

    // Get port from config - the service name in config is BACKEND_SERVICENAME (uppercase)
    const configKey = `BACKEND_${domain.toUpperCase()}`;
    const serviceConfig = config.services[configKey];

    if (!serviceConfig) {
      errors.push(`Service ${configKey} not found in config/config.json`);
      return { success: false, errors };
    }

    const port = serviceConfig.prod;
    const dataFolders = serviceConfig.dataFolders || [];

    // Render the template with the service name, port, and data folders
    const expectedDockerfile = ejs.render(template, { serviceName: domain, port, dataFolders });

    // Normalize whitespace for comparison (trim each line and remove empty lines at start/end)
    const normalize = (content: string): string => {
      return content
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim();
    };

    const normalizedActual = normalize(actualDockerfile);
    const normalizedExpected = normalize(expectedDockerfile);

    if (normalizedActual !== normalizedExpected) {
      errors.push('Dockerfile does not match template');

      // Find the first difference for better error messages
      const actualLines = normalizedActual.split('\n');
      const expectedLines = normalizedExpected.split('\n');

      for (let i = 0; i < Math.max(actualLines.length, expectedLines.length); i++) {
        if (actualLines[i] !== expectedLines[i]) {
          errors.push(`First difference at line ${i + 1}:`);
          errors.push(`  Expected: ${expectedLines[i] || '(empty)'}`);
          errors.push(`  Actual:   ${actualLines[i] || '(empty)'}`);
          break;
        }
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    errors.push(`Failed to validate Dockerfile: ${error}`);
    return {
      success: false,
      errors,
    };
  }
}
