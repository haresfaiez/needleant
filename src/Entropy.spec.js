import { Reflexion } from './Reflexion.js'
import { Entropy, BodyEntropy } from './Entropy.js'
import { Evaluation } from './Evalution.js'
import { Divisor } from './Divisor.js'

describe('Method invocation entropy', () => {
  it('sums objects entropy and method entropy', () => {
    const code = 'f.c()'
    const entropy = new Entropy(
      Reflexion.parse(code, (ast) => ast.body),
      new Divisor(['f', 'z'])
    )

    const expected = new Evaluation(1, 2).plus(new Evaluation(1, 1))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('sums all invocation when a method invocation argument is a function call', () => {
    const code = 'f.c(b())'
    const entropy = new Entropy(
      Reflexion.parse(code, (ast) => ast.body),
      new Divisor(['f', 'z', 'b', 'c'])
    )

    const expected = new Evaluation(1, 4)
      .plus(new Evaluation(1, 1))
      .plus(new Evaluation(1, 4))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('sums all invocation when a arguments are functions calls', () => {
    const code = 'f.c(b(), c())'
    const entropy = new Entropy(
      Reflexion.parse(code, (ast) => ast.body),
      new Divisor(['f', 'z', 'b', 'c'])
    )

    const expected = new Evaluation(1, 4)
      .plus(new Evaluation(1, 1))
      .plus(new Evaluation(1, 4).plus(new Evaluation(1, 4)))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('considers all methods invocation for each method invocation entropy', () => {
    const code = 'f.aMethod(); f.anOtherMethod();'
    const divisor = Divisor.parse(code, (ast) => ast.body)
    const entropy = new BodyEntropy(
      Reflexion.parse(code, (ast) => ast.body),
      divisor
    )

    const expected = new Evaluation(1, 1).times(3).plus(new Evaluation(1, 2))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })
})

describe('Call entropy', () => {
  describe('when an argument of a call is also a call', () => {
    it('calculates possible identifiers when calls are nested', () => {
      const code = 'a(b())'
      const entropy = new Entropy(
        Reflexion.parse(code, (ast) => ast.body),
        new Divisor(['a', 'b', 'c'])
      )

      expect(entropy.evaluate().evaluate()).toEvaluateTo(new Evaluation(2, 3))
    })

    it('calculates possible identifiers when three calls are nested', () => {
      const code = 'a(b(c()))'
      const entropy = new Entropy(
        Reflexion.parse(code, (ast) => ast.body),
        new Divisor(['a', 'b', 'c', 'd'])
      )

      expect(entropy.evaluate().evaluate()).toEvaluateTo(new Evaluation(3, 4))
    })

    it('is the sum of both calls entropy when the inner call is extracted', () => {
      const code = 'const x = b(); call(x)'
      const entropy = new BodyEntropy(
        Reflexion.parse(code, (ast) => ast.body),
        new Divisor(['b', 'call'])
      )

      const expected = new Evaluation(1, 3)
        .plus(new Evaluation(2, 3))
      expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
    })

    it('is the sum of all calls', () => {
      const code = 'const x = b(); a(c, x, d())'
      const entropy = new BodyEntropy(
        Reflexion.parse(code, (ast) => ast.body),
        new Divisor(['a', 'b', 'c', 'd'])
      )

      const expected = new Evaluation(1, 5).plus(new Evaluation(4, 5))
      expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
    })
  })
})

describe('Import statement entropy', () => {
  it('calculates entropy of import specfiers', () => {
    const code = 'import { a } from "./a"'
    const specifiers = Reflexion.parse(code, (ast) => ast.body)

    const entropy = new BodyEntropy(specifiers, new Divisor(['a', 'b']))

    expect(entropy.evaluate().evaluate()).toEvaluateTo(new Evaluation(1, 2))
  })

  it('calculates entropy of two import specfiers', () => {
    const code = 'import { a, b } from "./a"'
    const specifiers = Reflexion.parse(code, (ast) => ast.body)

    const entropy = new BodyEntropy(specifiers, new Divisor(['a', 'b', 'c']))

    expect(entropy.evaluate().evaluate()).toEvaluateTo(new Evaluation(2, 3))
  })

  it('calculates entropy of wildcard import specfier', () => {
    const code = 'import * as A from "./a"'
    const specifiers = Reflexion.parse(code, (ast) => ast.body)

    const entropy = new BodyEntropy(specifiers, new Divisor(['a', 'b', 'c']))

    expect(entropy.evaluate().evaluate()).toEvaluateTo(new Evaluation(3, 3))
  })

  it('calculates entropy of import source', () => {
    const code = 'import { a } from "./a"'
    const source = Reflexion.parse(code, (ast) => ast.body)

    const entropy = new BodyEntropy(source, new Divisor(['./a', './b', './c']))

    expect(entropy.evaluate().evaluate()).toEvaluateTo(new Evaluation(1, 3))
  })
})

describe('Function body entropy', () => {
  it('is the body statement entropy for identity function', () => {
    const code = 'const identity = (aNumber) => aNumber;'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expectedEvaluation = new Evaluation(1, 2)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expectedEvaluation)
  })

  it('with local variables does not affect global scope', () => {
    const code = `
      const a = (i) => {
        const next = i + 1;
        return next;
      };
      a(4, 5);
    `
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expectedEvaluation =
      new Evaluation(2, 4)
        .plus(new Evaluation(1, 3))
        .plus(new Evaluation(2, 2))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expectedEvaluation)
  })

  it('defined variable does not impace top-level scope', () => {
    const code = `
      const start = 40;
      const a = (aNumber) => {
        return start - aNumber;
      };
      a(4);
    `
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expectedEvaluation =
      new Evaluation(1, 2)
        .plus(new Evaluation(2, 3))
        .plus(new Evaluation(2, 3))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expectedEvaluation)
  })

  it('does not impact another function', () => {
    const code = `
      const increment = (i) => {
        const next = i + 1;
        return next;
      };
      const decrementTwice = (n) => {
        const first = n - 1;
        const second = first - 1;
        return second;
      }
      decrementTwice(increment(20))
    `
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expectedEvaluation =
      new Evaluation(2, 4)
        .plus(new Evaluation(1, 3))
        .plus(new Evaluation(2, 5))
        .plus(new Evaluation(2, 6))
        .plus(new Evaluation(1, 5))
        .plus(new Evaluation(3, 3))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expectedEvaluation)
  })

  it('calculates named function entropy', () => {
    const code = 'function one() { return 1; }'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expectedEvaluation = new Evaluation(1, 2)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expectedEvaluation)
  })
})

describe('Variable declaration entropy', () => {
  it('calculates property entropy from accessed properties', () => {
    const code = 'const a = {x: 3, y: 0}; const tmp = a.x;'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 4).times(2).plus(new Evaluation(1, 2).times(2))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates property entropy for member of member access', () => {
    const code = 'const tmp = a.x.y;'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 1)
      .plus(new Evaluation(1, 1))
      .plus(new Evaluation(1, 2))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of declaration with two initialization', () => {
    const code = 'const a = 0, b = a'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 3).plus(new Evaluation(1, 2))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of class definition and instantiation', () => {
    const code = 'class Example {}; const a = new Example();'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 2)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of class definition with a method', () => {
    const code = 'class Example { sayHello(name) { return "Hello " + name } }'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(2, 3)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of class definition with two methods', () => {
    const code = 'class Example { sayHello(name) { return "Hello " + name } identity(x) { return x; } }'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(2, 3).plus(new Evaluation(1, 2))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of class instantiation with an object', () => {
    const code = 'class User {}; const a = new User({ name: "Joe" });'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 2).plus(new Evaluation(1, 4))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of class instantiation with an object with two attributes', () => {
    const code = 'class User {}; const a = new User({ name: "Joe", lastName: "James" });'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 2).plus(new Evaluation(1, 5)).plus(new Evaluation(1, 5))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })
})

describe('Class definition entropy', () => {
  it('calculates entropy of class definition with one property and one method', () => {
    const code = `class A {
      // Skip if auditResults is missing a particular audit result
      meta = {s: 1};

      /**
       * Comment
       */
      start(passContext) { }
    }
    `
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 5)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of class definition, instanciation, and usage', () => {
    const code = `class A {
      constructor(argument) {
        this.a = argument;
      }

      read() {}

      write() {}
    }
    const instance = new A(12)
    instance.write()
    `
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 2)
      .plus(new Evaluation(1, 3))
      .plus(new Evaluation(1, 2))
      .plus(new Evaluation(1, 2))
      .plus(new Evaluation(1, 3))
      .plus(new Evaluation(1, 2))
      .plus(new Evaluation(1, 3))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of class extension', () => {
    const code = 'class A extends B {}'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 1)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy class extension of defined class', () => {
    const code = 'class C {}; class B {}; class A extends B {}'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 2)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })
})

describe('Update expression entropy', () => {
  it('calculates "++" entropy', () => {
    const code = 'i++'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(2, 1)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates "--" entropy', () => {
    const code = 'i--'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(2, 1)
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })
})


describe('Assignment entropy', () => {
  it('calculates inline assignment entropy', () => {
    const code = 'let a = 0; a = 2'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected =  new Evaluation(1, 2).plus(new Evaluation(1, 2))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })
})


describe('Loop entropy', () => {
  it('calculates entropy of empty for-loop', () => {
    const code = 'for (let i = 0; i < 10; i++) { }'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected = new Evaluation(1, 2)
      .plus(new Evaluation(2, 2))
      .plus(new Evaluation(1, 1))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  it('calculates entropy of for-loop with two variables and a body', () => {
    const code = 'for (let i = 0, j = 10; i < 10; i++, j--) { if (i == j) { break; } }'
    const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

    const expected = new Evaluation(1, 3)
      .times(2)
      .plus(new Evaluation(2, 3))
      .plus(new Evaluation(1, 2).times(2))
      .plus(new Evaluation(2, 2))
    expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  })

  // TODO: Uncomment these tests
  // it('encloses loop init variables inside the loop scope', () => {
  //   const code = 'for (let i = 0; i < 10; i++) { } const a = 2; const c = a + 19;'
  //   const entropy = new BodyEntropy(Reflexion.parse(code, (ast) => ast.body))

  //   const expected = new Evaluation(1, 2)
  //     .plus(new Evaluation(2, 2))
  //     .plus(new Evaluation(1, 1))
  //     .plus(new Evaluation(1, 2))
  //     .plus(new Evaluation(2, 3))
  //   expect(entropy.evaluate().evaluate()).toEvaluateTo(expected)
  // })

//   it('calculates entropy of while-loop', () => {
//   })
//
//   it('calculates entropy of do-while-loop', () => {
//   })
//
//   it('calculates entropy of for-each iterator', () => {
//   })
})

// TODO: update expresison ++/--
// describe('Array definition entropy', () => {
//   // TODO: check all forms of loops
// })
