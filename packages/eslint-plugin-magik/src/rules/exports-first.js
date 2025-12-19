/** @type {import('eslint').Rule.RuleModule} */
export const exportsFirst = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require exported declarations to appear before non-exported declarations',
      recommended: false,
    },
    schema: [],
    messages: {
      exportAfterNonExport:
        "Exported declaration '{{ exportName }}' (line {{ exportLine }}) must come before non-exported declaration '{{ nonExportName }}' (line {{ nonExportLine }})",
    },
  },
  create(context) {
    /** @type {Array<{line: number, type: 'exported' | 'non-exported', name: string}>} */
    const declarations = []

    /**
     * @param {import('eslint').Rule.Node} node
     * @param {'exported' | 'non-exported'} type
     * @param {string} name
     */
    function addDeclaration(node, type, name) {
      if (node.loc) {
        declarations.push({
          line: node.loc.start.line,
          type,
          name,
        })
      }
    }

    /**
     * @param {import('eslint').Rule.Node} node
     * @returns {string | null}
     */
    function getDeclarationName(node) {
      // Handle FunctionDeclaration
      if (node.type === 'FunctionDeclaration' && node.id) {
        return node.id.name
      }
      // Handle VariableDeclaration
      if (node.type === 'VariableDeclaration' && node.declarations.length > 0) {
        const firstDeclarator = node.declarations[0]
        if (firstDeclarator.id.type === 'Identifier') {
          return firstDeclarator.id.name
        }
      }
      // Handle ClassDeclaration
      if (node.type === 'ClassDeclaration' && node.id) {
        return node.id.name
      }
      return null
    }

    return {
      // Track exported declarations
      ExportNamedDeclaration(node) {
        if (node.declaration) {
          const name = getDeclarationName(node.declaration)
          if (name) {
            addDeclaration(node, 'exported', name)
          }
        }
      },

      // Track non-exported function declarations at module level
      FunctionDeclaration(node) {
        // Only track if it's a direct child of the program (module level)
        // and not wrapped in an export
        if (node.parent?.type === 'Program' && node.id) {
          addDeclaration(node, 'non-exported', node.id.name)
        }
      },

      // Track non-exported variable declarations at module level
      VariableDeclaration(node) {
        // Only track if it's a direct child of the program (module level)
        // and not wrapped in an export
        if (node.parent?.type === 'Program' && node.declarations.length > 0) {
          const firstDeclarator = node.declarations[0]
          if (firstDeclarator.id.type === 'Identifier') {
            addDeclaration(node, 'non-exported', firstDeclarator.id.name)
          }
        }
      },

      // Track non-exported class declarations at module level
      ClassDeclaration(node) {
        // Only track if it's a direct child of the program (module level)
        // and not wrapped in an export
        if (node.parent?.type === 'Program' && node.id) {
          addDeclaration(node, 'non-exported', node.id.name)
        }
      },

      // Check order at the end of the file
      'Program:exit'(node) {
        // Find the first non-exported declaration's line
        let firstNonExportLine = Infinity
        let firstNonExportName = ''

        for (const decl of declarations) {
          if (decl.type === 'non-exported') {
            if (decl.line < firstNonExportLine) {
              firstNonExportLine = decl.line
              firstNonExportName = decl.name
            }
          }
        }

        // Check if any export comes after a non-export
        for (const decl of declarations) {
          if (decl.type === 'exported' && decl.line > firstNonExportLine) {
            context.report({
              node,
              messageId: 'exportAfterNonExport',
              data: {
                exportName: decl.name,
                exportLine: String(decl.line),
                nonExportName: firstNonExportName,
                nonExportLine: String(firstNonExportLine),
              },
            })
            // Only report once per file to avoid noise
            break
          }
        }
      },
    }
  },
}
