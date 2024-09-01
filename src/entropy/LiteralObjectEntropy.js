import { Entropies } from './Entropies.js'
import { MonoEntropy } from './MonoEntropy.js'
import { Entropy } from './Entropy.js'

// TODO: Merge with DeclarationsEntropy (next. release)
export class LiteralObjectEntropy extends MonoEntropy {
  evaluate() {
    this.divisor.extendAccesses(this.dividend.properties())

    return new Entropies(
      this.astNode
        .properties
        .map(eachSource => new Entropy(eachSource.value, this.divisor))
    ).evaluate()
  }
}