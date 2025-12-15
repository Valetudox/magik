#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { join } from 'path';
import ejs from 'ejs';

const PROJECT_ROOT = join(import.meta.dir, '../..');
const CONFIG_PATH = join(PROJECT_ROOT, 'config/config.json');
const TEMPLATE_PATH = join(PROJECT_ROOT, '_templates/docker-compose/prod/docker-compose.yml.ejs.t');
const ACTUAL_PATH = join(PROJECT_ROOT, 'docker-compose.prod.yml');

interface ServiceConfig {
  dev: number;
  prod: number;
  apiRoute: string;
  containerName: string;
  backendMode: string;
  dataFolders: string[];
}

interface Config {
  services: Record<string, ServiceConfig>;
}

try {
  // Read config
  const configContent = readFileSync(CONFIG_PATH, 'utf-8');
  const config: Config = JSON.parse(configContent);

  // Read template
  const template = readFileSync(TEMPLATE_PATH, 'utf-8');

  // Render expected content
  const expected = ejs.render(template, {
    services: config.services,
  });

  // Read actual file
  const actual = readFileSync(ACTUAL_PATH, 'utf-8');

  // Compare
  if (expected !== actual) {
    console.error('❌ docker-compose.prod.yml is out of sync with template');
    console.error('   Run: ./scripts/generate-docker-compose.ts');
    process.exit(1);
  }

  console.log('✓ docker-compose.prod.yml is in sync with template');
} catch (error) {
  console.error('❌ Error validating docker-compose.prod.yml:', error);
  process.exit(1);
}
