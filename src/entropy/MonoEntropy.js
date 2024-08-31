import { Reflexion } from '../reflexion/Reflexion.js'
import { Divisor } from '../reflexion/Divisor.js'

export class MonoEntropy {
  constructor(dividend, divisor = new Divisor()) {
    this.dividend = Reflexion.fromAcornNodes([dividend])
    this.divisor = divisor
  }

  evaluate() {
    throw new Error('`Entropy#evaluate` not implemented yet in `Entropy`!')
  }
}