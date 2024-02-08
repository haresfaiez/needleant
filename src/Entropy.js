import { AntTrail } from './AntTrail.js'
import { Evaluation } from './Evalution.js'

export class Entropy {
  constructor(ast, scope) {
    this.subject = ast
    this.scope = scope
  }

  calculate() {
    throw new Error('Non implemented yet')
  }

  minus(dependency) {
    return this.calculate() - dependency.calculate()
  }
}

export class JointEntropy extends Entropy {
  calculate() {
    return this.subject.sources
      .map(eachSource => new ExpressionEntropy(new AntTrail(eachSource), this.scope))
      .map(e => e.calculate())
      .reduce((a, b) => a + b, 0)
  }
}
  
export class DependencyEntropy extends Entropy {
  calculate() {
    if (this.scope) {
      const actualCount = this.subject.steps().length
      const allPossibilitiesCount = this.scope.exports().length
      return new Evaluation(actualCount, allPossibilitiesCount)
        .calculate()
    }

    const numberOfFiles = 2
    const possibleFiles = 2
    const fileProbabilty = 1/numberOfFiles
    return fileProbabilty * possibleFiles * Math.log2(numberOfFiles)
  }
}
  
export class DeclarationEntropy extends Entropy {
  kindProbability() {
    if (this.subject.sources[0].body?.[0].kind === 'let')
      return 2/6
  
    if (this.subject.sources[0].body?.[0].kind === 'var')
      return 1/6
  
    if (this.subject.sources[0].body?.[0].kind === 'const')
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
  calculate() {
    const actualCount = this.subject.identifiers().length > 0 ? this.subject.steps().length : 0
    const allPossibilitiesCount = this.scope.length
    const localPossibilities = this.subject.identifiers().length + this.subject.literalsWeight()
    return new Evaluation(actualCount, allPossibilitiesCount)
      .withLocalPossibilities(localPossibilities)
      .calculate()
  }
}
