import * as Acorn from 'acorn'
import * as AcornWalk from 'acorn-walk'

import { CodeSlice } from '../code/CodeSlice.js'
import { CodeBag } from '../code/CodeBag.js'
import { CodePath } from '../code/CodePath.js'

export class Spectrum {
  constructor(acornNodes) {
    this.sources =
      acornNodes.filter(eachSource => eachSource.type !== 'EmptyStatement')
  }

  collectPaths(expression, collector) {
    const fromAncestors = (ancestorAstNodes) => {
      const pathComponents = []

      ancestorAstNodes
        .forEach(eachNode => ({
          PropertyDefinition(node) {
            pathComponents.push(node.key.name)
          },
          ClassDeclaration(node) {
            pathComponents.push(node.id.name)
          },
          MethodDefinition(node) {
            pathComponents.push(node.key.name)
          },
          VariableDeclarator(node) {
            pathComponents.push(node.id.name)
          },
          FunctionDeclaration(node) {
            pathComponents.push(node.id.name)
          }
        })[eachNode.type]?.(eachNode))

      return new CodePath(pathComponents)
    }

    AcornWalk.ancestor(expression, {
      PropertyDefinition(node, _state, ancestors) {
        if (CodePath.isBoundary(node)) {
          collector.push(fromAncestors(ancestors))
        }
      },
      ClassDeclaration(_node, _state, ancestors) {
        collector.push(fromAncestors(ancestors))
      },
      MethodDefinition(_node, _state, ancestors) {
        collector.push(fromAncestors(ancestors))
      },
      VariableDeclarator(node, _state, ancestors) {
        if (CodePath.isBoundary(node)) {
          collector.push(fromAncestors(ancestors))
        }
      },
      FunctionDeclaration(_node, _state, ancestors) {
        collector.push(fromAncestors(ancestors))
      }
    })
  }

  collectExports(expression, bag) {
    AcornWalk.simple(expression, {
      ExportNamedDeclaration(node) {
        bag.merge(Spectrum.fromAcornNodes([node]).identifiers())
      }
    })
  }

  collectLiterals(expression, bag) {
    AcornWalk.simple(expression, {
      Literal(node) {
        bag.put(new CodeSlice(node.value, node.start, node.end))
      }
    })
  }

  collectProperties(expression, bag) {
    AcornWalk.simple(expression, {
      Property(node) {
        bag.put(new CodeSlice(node.key.name, node.start, node.end))
      },
    })
  }

  collectIdentifiers(expression, bag) {
    // TODO: find out why the following commented node names are so
    AcornWalk.simple(expression, {
      // ObjectExpression(node) {
      //   console.log('ObjectExpr/', node)
      //   node.properties
      //     .map(e => e.key.name)
      //      // TODO: this new CodeSlice(... start end)
      //     .forEach(eachPropertyIdentifier => bag.put(new CodeSlice(eachPropertyIdentifier)))
      // },
      Identifier(node) {
        bag.put(new CodeSlice(node.name, node.start, node.end))
      },
      ImportDefaultSpecifier(node) {
        bag.put(new CodeSlice(node.local.name, node.start, node.end))
      },
      ImportNamespaceSpecifier(node) {
        bag.put(new CodeSlice(node.local.name, node.start, node.end))
      },
      ImportSpecifier(node) {
        bag.put(new CodeSlice(node.imported.name, node.start, node.end))
      },
      FunctionDeclaration(node) {
        bag.put(new CodeSlice(node.id.name, node.start, node.end))
      },
      // VariableDeclarator(node) {
      //   bag.put(new CodeSlice(node.id.name, node.start, node.end))
      // },
    })
  }

  paths() {
    const result = []
    for (const eachSource of this.sources) {
      this.collectPaths(eachSource, result)
    }
    return result
  }

  properties() {
    const bag = new CodeBag()
    bag.collect(this.sources, this.collectProperties)
    return bag
  }

  identifiers() {
    const bag = new CodeBag()
    bag.collect(this.sources, this.collectIdentifiers)
    return bag
  }

  api() {
    const bag = new CodeBag()
    bag.collect(this.sources, this.collectExports)
    return bag
  }

  literals() {
    const bag = new CodeBag()
    bag.collect(this.sources, this.collectLiterals)
    return bag
  }

  // Factories
  static fromAcornNodes(nodes = []) {
    return new Spectrum(nodes)
  }

  static parse(sourceCode, transformer) {
    const ast = Acorn.parse(sourceCode, { ecmaVersion: 2023, sourceType: 'module' })
    const astForSpectrum = transformer ? transformer(ast) : ast
    return Spectrum.fromAcornNodes(astForSpectrum)
  }
}


