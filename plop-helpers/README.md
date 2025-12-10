# Plop Helpers

This directory contains custom JavaScript helper functions used by plop.js generators.

## Helper Modules

### route-parser.js

Utilities for parsing and transforming API routes.

**Functions:**
- `extractParams(route)` - Extracts parameter names from route
- `routeToPath(route)` - Converts API route to file path
- `calculateImportDepth(route)` - Calculates directory nesting depth
- `generateImportPath(depth)` - Generates relative import path string
- `hasParams(route)` - Checks if route contains parameters

**Example:**
```javascript
extractParams('/api/decisions/:id/options/:optionId')
// Returns: ['id', 'optionId']

routeToPath('/api/decisions/:id')
// Returns: 'actions/decisions/[id]'

calculateImportDepth('/api/decisions/:id/options')
// Returns: 3 (decisions/[id]/options)

generateImportPath(3)
// Returns: '../../../../'
```

### string-helpers.js

String transformation utilities for code generation.

**Functions:**
- `camelCase(str)` - Converts to camelCase
- `pascalCase(str)` - Converts to PascalCase
- `kebabCase(str)` - Converts to kebab-case
- `upperCase(str)` - Converts to UPPER_CASE
- `contains(str, substr)` - Checks for substring

**Example:**
```javascript
camelCase('my-service-name')
// Returns: 'myServiceName'

pascalCase('my-service-name')
// Returns: 'MyServiceName'

upperCase('my-service')
// Returns: 'MY_SERVICE'
```

### validators.js

Input validation functions for generator prompts.

**Functions:**
- `validateServiceName(name)` - Validates service name format
- `validatePort(port)` - Validates port number range
- `validateRoute(route)` - Validates API route format
- `validateFunctionName(name)` - Validates function name format

**Example:**
```javascript
validateServiceName('my-service')
// Returns: true

validateServiceName('MyService')
// Returns: 'Service name must be in kebab-case'

validatePort(4000)
// Returns: true

validatePort(99999)
// Returns: 'Port must be between 1 and 65535'
```

## Usage in Templates

These helpers are registered in `plopfile.js` and available in all Handlebars templates:

```handlebars
// Using string helpers
{{camelCase serviceName}}
{{pascalCase serviceName}}

// Using route helpers
{{routeToPath route}}
{{#each (extractParams route)}}
  {{this}}: string
{{/each}}

// Using conditionals
{{#if (hasParams route)}}
  // Has parameters
{{/if}}
```

## Usage in plopfile.js

Helpers are imported and registered at the top of `plopfile.js`:

```javascript
import { extractParams, routeToPath } from './plop-helpers/route-parser.js'
import { camelCase, pascalCase } from './plop-helpers/string-helpers.js'
import { validateServiceName } from './plop-helpers/validators.js'

export default function (plop) {
  plop.setHelper('camelCase', camelCase)
  plop.setHelper('extractParams', extractParams)
  // ... more helpers
}
```

## Adding New Helpers

1. Add function to appropriate helper file
2. Export the function
3. Import in `plopfile.js`
4. Register with `plop.setHelper()`
5. Document in this README
6. Add tests if needed

## Best Practices

1. **Keep helpers pure** - No side effects, return consistent output
2. **Handle edge cases** - Validate inputs, return meaningful errors
3. **Document clearly** - Include JSDoc comments with examples
4. **Test thoroughly** - Verify with various inputs
5. **Keep focused** - Each helper should do one thing well

## Related Files

- `/plopfile.js` - Helper registration
- `/plop-templates/` - Templates that use helpers
- `/documentation/CODE_GENERATION.md` - Usage documentation
