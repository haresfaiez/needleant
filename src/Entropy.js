import { AntTrail } from './AntTrail.js'
import { Evaluation, NullEvaluation } from './Evalution.js'
import { AstGround } from './Ground.js'

export class Entropy {
  constructor(dividend, divisor) {
    this.dividend = dividend
    this.divisor = divisor
  }

  calculate() {
    return this.evaluate().calculate()
  }

  evaluate() {
    throw new Error('Non implemented yet')
  }

  minus(other) {
    return this.calculate() - other.calculate()
  }
}

export class JointEntropy extends Entropy {
  evaluate() {
    return this.dividend.sources
      .map(eachSource => new ExpressionEntropy(AntTrail.from(eachSource), this.divisor))
      .reduce((acc, eachEntropy) => acc.plus(eachEntropy.evaluate()), new NullEvaluation())
  }
}
  
export class DependencyEntropy extends Entropy {
  evaluate() {
    const importParts = new AstGround(this.dividend.sources[0]).delegate.__factorize()
    const importSpecifiers = importParts[0]
    const importSource = importParts[1]
    // TODO: Remove this check
    if (this.divisor.otherModules) {
      return new ExpressionEntropy(AntTrail.from(importSpecifiers), this.divisor.importedModuleExports).evaluate()
        .plus(new ExpressionEntropy(AntTrail.from(importSource), this.divisor.otherModules).evaluate())
    }

    const actualCount = this.dividend.odds().length
    const allPossibilitiesCount = this.divisor.odds().length
    return new Evaluation(actualCount, allPossibilitiesCount)
  }
}
  
export class DeclarationEntropy extends Entropy {
  kindProbability() {
    if (this.dividend.sources[0].body?.[0].kind === 'let')
      return 2/6
  
    if (this.dividend.sources[0].body?.[0].kind === 'var')
      return 1/6
  
    if (this.dividend.sources[0].body?.[0].kind === 'const')
      return 3/6
  
    throw new Error('Unknown declaration kind')
  }
  
  calculate() {
    const numberOfKinds = 3 // let, const, var
    const possibleKinds = 3
    const kindProbability = this.kindProbability() * (1/numberOfKinds)
    return kindProbability * possibleKinds * Math.log2(numberOfKinds)
  }
}

export class ExpressionEntropy extends Entropy {
  evaluate() {
    // TODO: simplify this method
    const actualCount = this.dividend.sources?.[0]?.type === 'ImportNamespaceSpecifier' ? 3 : (this.dividend.identifiers().length > 0 ? this.dividend.odds().length : 0)
    const allPossibilitiesCount = this.divisor.length
    const localPossibilities = this.dividend.identifiers().length + this.dividend.literalsWeight()
    return new Evaluation(actualCount, allPossibilitiesCount)
      .withLocalPossibilities(localPossibilities)
  }
}
