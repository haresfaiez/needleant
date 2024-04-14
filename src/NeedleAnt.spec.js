import { Evaluation, JointEvaluation } from './Evalution.js'
import NeedleAnt from './NeedleAnt.js'

describe('Function', () => {
  describe('body entropy', () => {
    it('with simple conditional', () => {
      const ant = new NeedleAnt('(a) => { if (a > 0) { return true; } else { return false; } }')
      expect(ant.entropy()).toBeCloseTo(.528, 2)
    })

    it('with simple conditional and sum return', () => {
      const ant = new NeedleAnt('(a) => { if (a > 0) { return a + 2; } else { return a + 4; } }')
      expect(ant.entropy()).toBeCloseTo(1.584, 2)
    })
  })

  describe('as references are similarely likely', () => {
    it('of function that returns a constant is null', () => {
      const ant = new NeedleAnt('() => 2')
      expect(ant.entropy()).toBe(0)
    })

    it('of function that takes an argument and returns a constant', () => {
      const ant = new NeedleAnt('2')
      expect(ant.entropy()).toBe(0)
    })

    it('of function that increments a number', () => {
      const ant = new NeedleAnt('a + 1')
      expect(ant.entropy()).toBeCloseTo(.528, 2)
    })

    it('of function that pre-increments a number', () => {
      const ant = new NeedleAnt('1 + a')
      expect(ant.entropy()).toBeCloseTo(.528, 2)
    })

    it('of function that sums all available variables', () => {
      const ant = new NeedleAnt('a + b')
      expect(ant.entropy()).toBe(0)
    })
  })
})

describe('Declarations entropy', () => {
  it('equals 0 if the string is empty both before and after', () => {
    const ant = new NeedleAnt('')
    expect(ant.coverEntropy('')).toBe(0)
  })

  it('equals 0 if the string does not change', () => {
    const ant = new NeedleAnt('a')
    expect(ant.coverEntropy('a')).toBe(0)
  })

  it('equals 0 when a "let" expression does not change', () => {
    const initialCode = 'let a'
    const updatedCode = 'let a'
    const ant = new NeedleAnt(initialCode)
    expect(ant.coverEntropy(updatedCode)).toBe(0)
  })

  it('equals 0 when a "let" expression does not change but the code changes', () => {
    const initialCode = 'let a'
    const updatedCode = 'let a;'
    const ant = new NeedleAnt(initialCode)
    expect(ant.coverEntropy(updatedCode)).toBe(0)
  })

  // TODO: uncomment this
  // it('increases unit when a "let" changes into a "var"', () => {
  //   const initialCode = 'let a'
  //   const updatedCode = 'var a'
  //   const ant = new NeedleAnt(initialCode)
  //   expect(ant.coverEntropy(updatedCode)).toBeGreaterThan(0)
  // })

  it('equals one identifier change unit when a constant name changes', () => {
    const initialCode = 'const a = 1'
    const updatedCode = 'const b = 1'
    const ant = new NeedleAnt(initialCode)
    expect(ant.coverEntropy(updatedCode)).toBe(4)
  })

  it('equals one identifier change unit when a constant name and length change', () => {
    const initialCode = 'const ab45 = 1'
    const updatedCode = 'const bf = 1'
    const ant = new NeedleAnt(initialCode)
    expect(ant.coverEntropy(updatedCode)).toBe(4)
  })
})

describe('Api change entropy', () => {
  it('equals one declaration change unit when an argument is added to the Api', () => {
    const initialCode = 'class Country { setCode(codeName) {} }'
    const updatedCode = 'class Country { setCode(codeName, countryName) {} }'
    const ant = new NeedleAnt(initialCode)
    expect(ant.coverEntropy(updatedCode)).toBe(8)
  })
})

describe('Entropy result', () => {
  it('calculates top level variable entropy', () => {
    const code = `import { a, b, c } from './other.js';
      const x = b();
      a(c, x);
    `

    const ant = new NeedleAnt(code)
    ant.addDependency('export const a = 1; export const b = 3; export const c = 45;')

    const actual = ant.scan()

    const expected = new JointEvaluation([
      new Evaluation(3, 3, 'import{a,b,c}from\'./other.js\';'),
      new Evaluation(1, 3, 'const x=b();'),
      new Evaluation(3, 4, 'a(c,x);')
    ])
    expect(actual).toEqual(expected)
  })
})