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
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  const val = Math.random()

  class Component {
    constructor (props) {
      this.props = props

      this.created()
    }

    created () {
      this.createdHooks()
    }

    ['observe prop'] ({ value }) {
      t.is(value, val)
      t.end()
    }
  }

  $$register({ Component })
  new Component(state)

  state.prop = { value: val }
})

test('__regie_observer_removers__ exists on initialized component', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  const val = Math.random()

  class Component {
    constructor (props) {
      this.props = props

      this.created()
    }

    created () {
      this.createdHooks()
    }

    ['observe prop.value'] ({ value }) {
      t.is(value, val)
      t.end()
    }
  }

  $$register({ Component })

  const comp = new Component(state)

  t.true(Array.isArray(comp.__regie_observer_removers__))
})

test.cb('Observers will not trigger handlers after component is disposed', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor (props) {
      this.props = props

      this.created()
    }

    created () {
      this.createdHooks()
    }

    ['observe prop.value'] () {
      t.fail()
    }

    dispose () {}
  }

  $$register({ Component })

  const comp = new Component(state)
  comp.dispose()

  state.prop.value = Math.random()

  t.pass()
  t.end()
})

test.cb('Observe state change with mapState string mapper', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor (props) {
      this.props = props || {}
      this.created()
    }

    created () {
      this.createdHooks()
    }

    mapStateToProps () {
      return {
        value: 'prop.value'
      }
    }

    ['observe value'] () {
      t.end()
    }

    dispose () {}
  }

  $$register({ Component })
  new Component()

  state.prop.value = Math.random()
})

test.cb('Observe state change with mapState method mapper', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  const newValue = Math.random()

  class Component {
    constructor (props) {
      this.props = props || {}
      this.created()
    }

    created () {
      this.createdHooks()
    }

    mapStateToProps () {
      return {
        value: state => state.prop.value
      }
    }

    ['observe value'] (newVal) {
      t.is(newValue, newVal)
      t.end()
    }

    dispose () {}
  }

  $$register({ Component })
  new Component()

  state.prop.value = newValue
})

test('Throws when changing prop with mapState', t => {
  const { $$register } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor (props) {
      this.props = props || {}
      this.created()
    }

    created () {
      this.createdHooks()
    }

    mapStateToProps () {
      return {
        value: state => state.prop.value
      }
    }

    dispose () {}
  }

  $$register({ Component })
  const cmp = new Component()

  const newVal = Math.random()

  t.throws(() => {
    cmp.props.value = newVal
  }, null, `Refusing to update 'value' to ${newVal}. Please use a mutation to mutate the state.`)
})

test('Get current value of prop after change', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor (props) {
      this.props = props || {}
      this.created()
    }

    created () {
      this.createdHooks()
    }

    mapStateToProps () {
      return {
        value: state => state.prop.value
      }
    }

    dispose () {}
  }

  $$register({ Component })
  const cmp = new Component()

  const newVal = Math.random()

  state.prop.value = newVal

  t.is(cmp.props.value, newVal)
})

test('Throws when observing non-existing props', t => {
  const { $$register } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor (props) {
      this.props = props || {}
      this.created()
    }

    created () {
      this.createdHooks()
    }

    mapStateToProps () {
      return {
        value: state => state.prop.value
      }
    }

    dispose () {}

    ['observe nope'] () {
      t.fail()
    }
  }

  $$register({ Component })

  t.throws(() => new Component())
})

test('Throws when observing primitive props', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor (props) {
      this.props = props || {}
      this.created()
    }

    created () {
      this.createdHooks()
    }

    dispose () { }

    ['observe val'] () {
      t.fail()
    }
  }

  $$register({ Component })

  t.throws(() => new Component({ val: state.prop.value }))
})

test('Throws when observing invalid type in mapStateToProps', t => {
  const { $$register } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor (props) {
      this.props = props || {}
      this.created()
    }

    created () {
      this.createdHooks()
    }

    mapStateToProps () {
      return {
        value: new Date()
      }
    }

    dispose () { }

    ['observe value'] () {
      t.fail()
    }
  }

  $$register({ Component })

  t.throws(() => new Component(), null, `Invalid type 'object' for 'value'. mapStateToProps should return an object whose properties are either strings or functions.`)
})
