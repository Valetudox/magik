import type { Rule } from 'eslint'
import type { Node, ExportNamedDeclaration, FunctionDeclaration, VariableDeclaration } from 'estree'

type DeclarationType = 'exported' | 'non-exported'

type DeclarationInfo = {
  type: DeclarationType
  line: number
  name: string
  node: Node
}

export const exportsFirst: Rule.RuleModule = {
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
    const declarations: DeclarationInfo[] = []

    function getDeclarationName(node: Node): string | null {
      if (node.type === 'FunctionDeclaration') {
        return (node as FunctionDeclaration).id?.name ?? null
      }
      if (node.type === 'VariableDeclaration') {
        const declaration = (node as VariableDeclaration).declarations[0]
        if (declaration?.id.type === 'Identifier') {
          return declaration.id.name
        }
      }
      if (node.type === 'ClassDeclaration' && 'id' in node && node.id) {
        return (node.id as { name: string }).name
      }
      return null
    }

    return {
      ExportNamedDeclaration(node: Node) {
        const exportNode = node as ExportNamedDeclaration
        if (exportNode.declaration && exportNode.loc) {
          const name = getDeclarationName(exportNode.declaration)
          if (name) {
            declarations.push({
              type: 'exported',
              line: exportNode.loc.start.line,
              name,
              node,
            })
          }
        }
      },

      FunctionDeclaration(node: Node) {
        const funcNode = node as FunctionDeclaration & Rule.Node
        // Only track non-exported function declarations
        if (funcNode.parent?.type !== 'ExportNamedDeclaration' && funcNode.loc) {
          const name = funcNode.id?.name
          if (name) {
            declarations.push({
              type: 'non-exported',
              line: funcNode.loc.start.line,
              name,
              node,
            })
          }
        }
      },

      VariableDeclaration(node: Node) {
        const varNode = node as VariableDeclaration & Rule.Node
        // Only track top-level non-exported variable declarations
        if (
          varNode.parent?.type === 'Program' &&
          varNode.loc
        ) {
          const declaration = varNode.declarations[0]
          if (declaration?.id.type === 'Identifier') {
            declarations.push({
              type: 'non-exported',
              line: varNode.loc.start.line,
              name: declaration.id.name,
              node,
            })
          }
        }
      },

      'Program:exit'() {
        // Find violations: any non-exported that comes before an exported
        const exported = declarations.filter((d) => d.type === 'exported')
        const nonExported = declarations.filter((d) => d.type === 'non-exported')

        for (const nonExp of nonExported) {
          for (const exp of exported) {
            if (nonExp.line < exp.line) {
              context.report({
                node: nonExp.node as Rule.Node,
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
