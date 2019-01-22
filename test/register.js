/* eslint-disable camelcase, no-new */

import test from 'ava'

import regie from '../'

test('Register regie as a plugin to another class', t => {
  const { $$register } = regie({})

  class Component {}

  $$register({ Component })

  t.is(typeof Component.prototype.created, 'function')
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

    ['observe val'] (newValue) {
      t.is(newValue, val)
      t.end()
    }
  }

  $$register({ Component })

  new Component(state)

  state.val = val
})
