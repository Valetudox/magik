/**
 * @type {import('eslint').Rule.RuleModule}
 */
export const exportsFirst = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require exported declarations to come before non-exported declarations',
    },
    messages: {
      exportsFirst:
        'Non-exported declaration "{{nonExported}}" (line {{nonExportedLine}}) should come after exported declaration "{{exported}}" (line {{exportedLine}})',
    },
    schema: [],
  },
  create(context) {
    /** @type {Array<{type: 'exported' | 'non-exported', line: number, name: string, node: import('estree').Node}>} */
    const declarations = []

    /**
     * @param {import('estree').Node} node
     * @returns {string | null}
     */
    function getDeclarationName(node) {
      if (node.type === 'FunctionDeclaration') {
        return node.id?.name ?? null
      }
      if (node.type === 'VariableDeclaration') {
        const declaration = node.declarations[0]
        if (declaration?.id.type === 'Identifier') {
          return declaration.id.name
        }
      }
      if (node.type === 'ClassDeclaration' && node.id) {
        return node.id.name
      }
      return null
    }

    return {
      ExportNamedDeclaration(node) {
        if (node.declaration && node.loc) {
          const name = getDeclarationName(node.declaration)
          if (name) {
            declarations.push({
              type: 'exported',
              line: node.loc.start.line,
              name,
              node,
            })
          }
        }
      },

      FunctionDeclaration(node) {
        // Only track top-level non-exported function declarations
        // Skip if parent is ExportNamedDeclaration (it's exported) or if not at Program level
        if (
          node.parent?.type !== 'ExportNamedDeclaration' &&
          node.parent?.type === 'Program' &&
          node.loc
        ) {
          const name = node.id?.name
          if (name) {
            declarations.push({
              type: 'non-exported',
              line: node.loc.start.line,
              name,
              node,
            })
          }
        }
      },

      // Note: We only track function declarations for exports-first rule
      // Variable declarations (const, let) are not tracked as they are often
      // configuration objects, schemas, or helper constants that logically
      // belong before the functions that use them

      'Program:exit'() {
        // Find violations: any non-exported that comes before an exported
        const exported = declarations.filter((d) => d.type === 'exported')
        const nonExported = declarations.filter((d) => d.type === 'non-exported')

        for (const nonExp of nonExported) {
          for (const exp of exported) {
            if (nonExp.line < exp.line) {
              context.report({
                node: nonExp.node,
                messageId: 'exportsFirst',
                data: {
                  nonExported: nonExp.name,
                  nonExportedLine: String(nonExp.line),
                  exported: exp.name,
                  exportedLine: String(exp.line),
                },
              })
              // Only report once per non-exported declaration
              break
            }
          }
        }
      },
    }
  },
}
