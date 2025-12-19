/**
 * @fileoverview Rule to enforce that exported declarations come before non-exported declarations
 * @author Magik Team
 */

/** @type {import('eslint').Rule.RuleModule} */
export const exportsFirst = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require exported declarations to be defined before non-exported declarations',
      category: 'Stylistic Issues',
      recommended: false,
    },
    schema: [],
    messages: {
      exportAfterNonExport:
        'Exported declaration "{{name}}" should be defined before non-exported declarations. Move it above line {{line}}.',
    },
  },

  create(context) {
    // Track the first non-exported function/const declaration
    let firstNonExportedNode = null

    // Helper to get the name of a declaration
    function getDeclarationName(node) {
      if (node.type === 'FunctionDeclaration' && node.id) {
        return node.id.name
      }
      if (node.type === 'VariableDeclaration' && node.declarations[0]?.id) {
        const id = node.declarations[0].id
        return id.type === 'Identifier' ? id.name : '<anonymous>'
      }
      if (node.type === 'TSTypeAliasDeclaration' && node.id) {
        return node.id.name
      }
      return '<anonymous>'
    }

    // Helper to check if a node is a non-exported function or const declaration
    function isNonExportedDeclaration(node) {
      // Skip if parent is an export
      if (node.parent?.type === 'ExportNamedDeclaration') {
        return false
      }

      // Check for function declarations
      if (node.type === 'FunctionDeclaration') {
        return true
      }

      // Check for const declarations (arrow functions or values)
      if (node.type === 'VariableDeclaration' && node.kind === 'const') {
        return true
      }

      return false
    }

    // Helper to check if a node is an exported declaration
    function isExportedDeclaration(node) {
      if (node.type !== 'ExportNamedDeclaration') {
        return false
      }

      // Check for direct exports like: export function foo() {}
      if (node.declaration) {
        return (
          node.declaration.type === 'FunctionDeclaration' ||
          node.declaration.type === 'VariableDeclaration' ||
          node.declaration.type === 'TSTypeAliasDeclaration'
        )
      }

      return false
    }

    return {
      // Track non-exported function declarations
      FunctionDeclaration(node) {
        if (isNonExportedDeclaration(node) && !firstNonExportedNode) {
          firstNonExportedNode = node
        }
      },

      // Track non-exported const declarations
      VariableDeclaration(node) {
        if (isNonExportedDeclaration(node) && !firstNonExportedNode) {
          firstNonExportedNode = node
        }
      },

      // Check exported declarations
      ExportNamedDeclaration(node) {
        if (!isExportedDeclaration(node)) {
          return
        }

        // If we have a non-exported declaration before this export, report an error
        if (firstNonExportedNode && node.loc && firstNonExportedNode.loc) {
          if (node.loc.start.line > firstNonExportedNode.loc.start.line) {
            const name = node.declaration ? getDeclarationName(node.declaration) : '<anonymous>'
            context.report({
              node,
              messageId: 'exportAfterNonExport',
              data: {
                name,
                line: firstNonExportedNode.loc.start.line,
              },
            })
          }
        }
      },
    }
  },
}
