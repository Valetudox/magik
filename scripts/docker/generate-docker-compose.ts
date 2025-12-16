#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import ejs from 'ejs';

const PROJECT_ROOT = join(import.meta.dir, '..');
const CONFIG_PATH = join(PROJECT_ROOT, 'config/config.json');
const TEMPLATE_PATH = join(PROJECT_ROOT, '_templates/docker-compose/prod/docker-compose.yml.ejs.t');

// Generate to /tmp with unique ID (timestamp + process ID)
const OUTPUT_PATH = `/tmp/magik-docker-compose-${Date.now()}-${process.pid}.yml`;

interface ServiceConfig {
  dev: number;
  prod: number;
  apiRoute: string;
  containerName: string;
  backendMode: string;
  dataFolders: string[];
}

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
  services: Record<string, ServiceConfig>;
  uis: Record<string, UIConfig>;
}

try {
  // Read config
  const configContent = readFileSync(CONFIG_PATH, 'utf-8');
  const config: Config = JSON.parse(configContent);

  // Read template
  const template = readFileSync(TEMPLATE_PATH, 'utf-8');

  // Render template
  const rendered = ejs.render(template, {
    services: config.services,
    uis: config.uis,
  });

  // Write output
  writeFileSync(OUTPUT_PATH, rendered);

  // Output only the path for scripts to capture
  console.log(OUTPUT_PATH);
} catch (error) {
  console.error('❌ Error generating docker-compose.prod.yml:', error);
  process.exit(1);
}
