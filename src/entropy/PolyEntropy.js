import { Reflexion } from '../reflexion/Reflexion.js'
import { Divisor } from '../reflexion/Divisor.js'
import { FoundCodePath, NotFoundCodePath } from '../code/CodePath.js'
import { NullEvaluation } from '../evaluation/NullEvaluation.js'

export class PolyEntropy {
  constructor(astNodes, divisor = new Divisor()) {
    this.astNodes = astNodes.filter(astNode => astNode.type !== 'EmptyStatement')
    this.dividend = Reflexion.fromAcornNodes(astNodes)
    this.divisor = divisor
  }

  createFoundCodePath(path, entropies) {
    return entropies.reduce(
      (resultCodePath, eachFoundCodePath) => resultCodePath.plus(eachFoundCodePath),
      new FoundCodePath(path, new NullEvaluation(), this.divisor.identifiers())
    )
  }

  navigate(path) {
    return new NotFoundCodePath(path)
  }

  evaluate() {
    throw new Error('`PolyEntropy#evaluate` not implemented yet in `PolyEntropy`!')
  } 
}