import * as Acorn from 'acorn'
import * as AcornWalk from 'acorn-walk'


class Subject {
  constructor(ast) {
    this.ast = ast
  }

  identifiers() {
    let result = []
    AcornWalk.simple(this.ast, {
      Identifier(node) {
        result.push(node.name)
      }
    })
    return result
  }

  literalsWeight() {
    let result = []
    AcornWalk.simple(this.ast, {
      Literal(node) {
        result.push(node.value)
      }
    })
    return result.length ? 1 : 0
  }

  factor() {
    let result = []
    AcornWalk.simple(this.ast, {
      Identifier(node) {
        result.push(node)
      },
      Literal(node) {
        result.push(node)
      }
    })
    return result
  }

  static parse(sourceCode) {
    return new Subject(Acorn.parse(sourceCode, { ecmaVersion: 2023, sourceType: 'module' }))
  }
}

export default Subject
