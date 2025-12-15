import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@typescript-eslint/parser';
import type { CallExpression, Literal } from 'estree';
import type { ValidationResult } from './types';

interface RouteInfo {
  method: string;
  path: string;
  handler: string;
  expectedFile: string;
}

function routeToExpectedFilePath(method: string, routePath: string): string {
  let path = routePath.replace(/^\/api\//, '');
  const segments = path.split('/').filter((seg) => seg !== '');
  const folderParts: string[] = [];

  for (const segment of segments) {
    if (segment.startsWith(':')) {
      folderParts.push(`[${segment.substring(1)}]`);
    } else {
      folderParts.push(segment);
    }
  }

  const folderPath = folderParts.join('/');
  const fileName = method.toLowerCase() + '.action.ts';

  return folderPath ? `${folderPath}/${fileName}` : fileName;
}

function extractRoutesFromFile(routesFilePath: string): RouteInfo[] {
  const content = readFileSync(routesFilePath, 'utf-8');
  const ast = parse(content, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    loc: true,
  });

  const routes: RouteInfo[] = [];

  function traverse(node: any) {
    if (!node) return;

    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'MemberExpression' &&
      node.callee.object?.name === 'fastify' &&
      node.callee.property?.name &&
      ['get', 'post', 'patch', 'delete', 'put'].includes(
        node.callee.property.name
      )
    ) {
      const routePath = (node as CallExpression).arguments[0];
      const handler = (node as CallExpression).arguments[1];
      const method = node.callee.property.name;

      if (routePath && routePath.type === 'Literal') {
        const path = (routePath as Literal).value as string;

        if (path !== '/health') {
          routes.push({
            method,
            path,
            handler: handler?.type === 'Identifier' ? handler.name : 'inline',
            expectedFile: routeToExpectedFilePath(method, path),
          });
        }
      }
    }

    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse);
        } else {
          traverse(node[key]);
        }
      }
    }
  }

  traverse(ast);
  return routes;
}

function getAllActionFiles(dirPath: string, basePath: string = ''): string[] {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    let files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        files = files.concat(getAllActionFiles(fullPath, relativePath));
      } else if (entry.isFile() && entry.name.endsWith('.action.ts')) {
        files.push(relativePath);
      }
    }

    return files;
  } catch {
    return [];
  }
}

export function validateRouteActions(
  serviceName: string,
  servicePath: string
): ValidationResult {
  const errors: string[] = [];
  const routesFile = join(servicePath, 'src', 'routes.ts');
  const actionsDir = join(servicePath, 'src', 'actions');

  try {
    const routes = extractRoutesFromFile(routesFile);
    const actualFiles = getAllActionFiles(actionsDir);
    const actualFileSet = new Set(actualFiles);
    const expectedFiles = new Set(routes.map((r) => r.expectedFile));

    // Find missing files
    for (const route of routes) {
      if (!actualFileSet.has(route.expectedFile)) {
        errors.push(
          `Missing action file: actions/${route.expectedFile} for route ${route.method.toUpperCase()} ${route.path}`
        );
      }
    }

    // Find extra files
    for (const actualFile of actualFiles) {
      if (!expectedFiles.has(actualFile)) {
        errors.push(`Unexpected action file: actions/${actualFile}`);
      }
    }
  } catch (error) {
    errors.push(`Failed to validate route-action alignment: ${error}`);
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
