/* eslint-disable camelcase, no-new */

import test from 'ava'

import regie from '../'

test('Register regie as a plugin to another class', t => {
  const { $$register } = regie({})

  class Component {}

  $$register({ Component })

  t.is(typeof Component.prototype.createdHooks, 'function')
  t.true(Array.isArray(Component.prototype.__regie_changes__))
})

test.cb('Utilize existing __regie_changes__ getter on a component and observe state change', t => {
  const { $$register, state } = regie({})

  const val = Math.random()

  const cb = newValue => {
    t.is(newValue, val)
    t.end()
  }

  class Component {
    constructor (state) {
      this.state = state

      this.created()
    }

    created () {
      this.createdHooks()
    }

    createdHooks () {}

    get __regie_changes__ () {
      return [[({ state }) => () => state.val, () => val => cb(val)]]
    }
  }

  $$register({ Component })

  new Component(state)

  state.val = val
})

test.cb('Utilize magic observer method on a component and observe state change', t => {
  const { $$register, state } = regie({})

  const val = Math.random()

  class Component {
    constructor (state) {
      this.props = state

      this.created()
    }

    created () {
      this.createdHooks()
    }

    ['observe val'] (newValue) {
      t.is(newValue, val)
      t.end()
    }
  }

  $$register({ Component })

  new Component(state)

  state.val = val
})

test('__regie_observer_removers__ exists on initialized component', t => {
  const { $$register, state } = regie({})

  const val = Math.random()

  class Component {
    constructor (state) {
      this.props = state

      this.created()
    }

    created () {
      this.createdHooks()
    }

    ['observe val'] (newValue) {
      t.is(newValue, val)
      t.end()
    }
  }

  $$register({ Component })

  const comp = new Component(state)

  t.true(Array.isArray(comp.__regie_observer_removers__))
})

test.cb('Observers will not trigger handlers after component is disposed', t => {
  const { $$register, state } = regie({})

  class Component {
    constructor (state) {
      this.props = state

      this.created()
    }

    created () {
      this.createdHooks()
    }

    ['observe val'] () {
      t.fail()
    }

    dispose () {}
  }

  $$register({ Component })

  const comp = new Component(state)
  comp.dispose()

  state.val = Math.random()

  t.pass()
  t.end()
})
