---
to: apps/backend-<%= serviceName %>/tsconfig.json
---
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*", "../../config/config.ts"],
  "exclude": ["node_modules"]
}
