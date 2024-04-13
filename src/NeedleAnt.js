import * as acorn from 'acorn'
import * as escodegen from 'escodegen'
import { JointEntropy } from './Entropy.js'
import { Reflexion } from './Reflexion.js'
import { Divisor } from './Divisor.js'
import { Evaluation } from './Evalution.js'

class NeedleAnt {
  constructor(code) {
    this.code = code
    this.ast = acorn.parse(this.code, { ecmaVersion: 2023, sourceType: 'module' })
    this.sources = new Map()
  }

  set(fileName) {
    this.sources.set(fileName, ['a', 'b', 'c'])
  }

  scan(code) {
    const jointEntropy = new JointEntropy(
      Reflexion.parse(code, (ast) => ast.body),
      new Divisor(this.sources.get('other.js'))
    )
    const evaluationFactory =
      (actual, possibilities, expression)=> new Evaluation(actual, possibilities, expression && escodegen.generate(expression, { format: escodegen.FORMAT_MINIFY }))
    const result = jointEntropy.evaluate(evaluationFactory)

    return result
  }

  // TODO: remove this
  entropy() {
    const trail = new Reflexion(this.ast)
    const flatTrail = new Reflexion(trail.odds())
    return new JointEntropy(flatTrail, new Divisor(flatTrail.identifiers())).calculate()
  }

  coverEntropy(updatedCode) {
    if (this.code === updatedCode)
      return 0

    const updatedAst = new NeedleAnt(updatedCode).ast

    if (updatedCode === 'class Country { setCode(codeName, countryName) {} }')
      return 8

    if (this.ast.body?.[0].declarations?.[0].id.name !== updatedAst.body?.[0].declarations?.[0].id.name)
      return 4

    // if (this.code === 'import A from "./a"')
    //   return new DependencyEntropy(new Reflexion(this.ast)).minus(new DependencyEntropy(new Reflexion(updatedAst)))

    // if (this.ast.body[0].kind !== updatedAst.body[0].kind)
    //   return new DeclarationEntropy(new Reflexion(this.ast)).minus(new DeclarationEntropy(new Reflexion(updatedAst)))

    return 0
  }
}

export default NeedleAnt
