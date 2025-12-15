import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as ejs from 'ejs';
import type { ValidationResult } from './types';

interface UIConfig {
  basePath: string;
  containerName: string;
  dependsOn: string[];
  port: number;
  openapiSpec: string;
  vitePort: number;
  needsSpecs?: boolean;
}

interface Config {
  uis: Record<string, UIConfig>;
}

/**
 * Validates that a frontend service's Dockerfile matches the template
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
      '_templates/ui-service/new/Dockerfile.ejs.t'
    );
    let template = readFileSync(templatePath, 'utf-8');

    // Remove frontmatter (first 3 lines: ---, to: ..., ---)
    const lines = template.split('\n');
    template = lines.slice(3).join('\n');

    // Get service name from directory (ui-xxx -> xxx)
    const domain = serviceName.replace(/^ui-/, '');

    // Read config to get UI settings
    const configPath = resolve(servicePath, '../..', 'config/config.json');
    const config: Config = JSON.parse(readFileSync(configPath, 'utf-8'));

    // Get UI config - the service name in config is UI_SERVICENAME (uppercase)
    const configKey = `UI_${domain.toUpperCase()}`;
    const serviceConfig = config.uis[configKey];

    if (!serviceConfig) {
      errors.push(`Service ${configKey} not found in config/config.json`);
      return { success: false, errors };
    }

    const { basePath, openapiSpec, needsSpecs = false } = serviceConfig;

    // Render the template with the service config
    const expectedDockerfile = ejs.render(template, {
      serviceName: domain,
      basePath,
      openapiSpec,
      needsSpecs,
    });

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
