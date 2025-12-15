#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import ejs from 'ejs';

const PROJECT_ROOT = join(import.meta.dir, '..');
const CONFIG_PATH = join(PROJECT_ROOT, 'config/config.json');
const TEMPLATE_PATH = join(PROJECT_ROOT, '_templates/docker-compose/prod/docker-compose.yml.ejs.t');
const OUTPUT_PATH = join(PROJECT_ROOT, 'docker-compose.prod.yml');

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

  // Render template
  const rendered = ejs.render(template, {
    services: config.services,
  });

  // Write output
  writeFileSync(OUTPUT_PATH, rendered);

  console.log('✓ Generated docker-compose.prod.yml successfully');
} catch (error) {
  console.error('❌ Error generating docker-compose.prod.yml:', error);
  process.exit(1);
}
