import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidationResult } from './types';

// Expected exact content for eslint.config.js
const EXPECTED_ESLINT_CONFIG = `import backendConfig from '../../eslint.config.backend.js'

export default backendConfig
`;

// Expected exact content for tsconfig.json (normalized)
const EXPECTED_TSCONFIG = {
  extends: '../../tsconfig.json',
  compilerOptions: {
    outDir: './dist',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
  },
  include: ['src/**/*', '../../config/config.ts'],
  exclude: ['node_modules'],
};

function areJSONEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function validateConfig(
  serviceName: string,
  servicePath: string
): ValidationResult {
  const errors: string[] = [];

  // Validate eslint.config.js
  const eslintConfigPath = join(servicePath, 'eslint.config.js');
  try {
    const actualEslintContent = readFileSync(eslintConfigPath, 'utf-8');

    if (actualEslintContent.trim() !== EXPECTED_ESLINT_CONFIG.trim()) {
      errors.push(
        `eslint.config.js content mismatch\n` +
          `Expected:\n${EXPECTED_ESLINT_CONFIG.trim()}\n` +
          `Actual:\n${actualEslintContent.trim()}`
      );
    }
  } catch (err) {
    errors.push(`Missing file: eslint.config.js`);
  }

  // Validate tsconfig.json
  const tsconfigPath = join(servicePath, 'tsconfig.json');
  try {
    const actualTsconfigContent = readFileSync(tsconfigPath, 'utf-8');
    const actualTsconfig = JSON.parse(actualTsconfigContent);

    if (!areJSONEqual(actualTsconfig, EXPECTED_TSCONFIG)) {
      errors.push(
        `tsconfig.json content mismatch\n` +
          `Expected:\n${JSON.stringify(EXPECTED_TSCONFIG, null, 2)}\n` +
          `Actual:\n${JSON.stringify(actualTsconfig, null, 2)}`
      );
    }
  } catch (err) {
    errors.push(`Missing or invalid file: tsconfig.json`);
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
