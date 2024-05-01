// @ts-nocheck
/* eslint-disable camelcase, no-new */

import test from 'ava'

import regie from '../'

test('Register regie as a plugin to another class', t => {
  const { $$register } = regie({})

  class Component {}

  $$register({ Component })

  t.is(typeof Component.prototype.createdHooks, 'function')
})

test('Utilize magic observer method on a component and observe state change', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  const val = Math.random()

  class Component {
    constructor(props) {
      this.props = props

      this.created()
    }

    created() {
      this.createdHooks()
    }

    ['observe prop']({ value }) {
      t.is(value, val)
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
    constructor(props) {
      this.props = props

      this.created()
    }

    created() {
      this.createdHooks()
    }

    ['observe prop.value']({ value }) {
      t.is(value, val)
    }
  }

  $$register({ Component })

  const comp = new Component(state)

  t.true(Array.isArray(comp.__regie_observer_removers__))
})

test('Observers will not trigger handlers after component is disposed', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor(props) {
      this.props = props

      this.created()
    }

    created() {
      this.createdHooks()
    }

    ['observe prop.value']() {
      t.fail()
    }

    dispose() {}
  }

  $$register({ Component })

  const comp = new Component(state)
  comp.dispose()

  state.prop.value = Math.random()

  t.pass()
})

test('Regie calls original createdHooks', t => {
  const { $$register, state } = regie({ initialState: {} })

  class Component {
    constructor(props) {
      this.props = props

      this.created()
    }

    created() {
      this.createdHooks()
    }

    createdHooks() {
      t.pass()
    }

    dispose() {}
  }

  $$register({ Component })

  new Component(state)
})

test('Observe state change with mapState string mapper', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    mapStateToProps() {
      return {
        value: 'prop.value',
      }
    }

    ['observe value']() {
      t.pass()
    }

    dispose() {}
  }

  $$register({ Component })
  new Component()

  state.prop.value = Math.random()
})

test('Observe state change with mapState method mapper', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  const newValue = Math.random()

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    mapStateToProps() {
      return {
        value: state => state.prop.value,
      }
    }

    ['observe value'](newVal) {
      t.is(newValue, newVal)
    }

    dispose() {}
  }

  $$register({ Component })
  new Component()

  state.prop.value = newValue
})

test('Throws when changing prop with mapState', t => {
  const { $$register } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    mapStateToProps() {
      return {
        value: state => state.prop.value,
      }
    }

    dispose() {}
  }

  $$register({ Component })
  const cmp = new Component()

  const newVal = Math.random()

  t.throws(
    () => {
      cmp.props.value = newVal
    },
    { message: `Refusing to update 'value' to ${newVal}. Please use a mutation to mutate the state.` },
  )
})

test('Get current value of prop after change', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    mapStateToProps() {
      return {
        value: state => state.prop.value,
      }
    }

    dispose() {}
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
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    mapStateToProps() {
      return {
        value: state => state.prop.value,
      }
    }

    dispose() {}

    ['observe nope']() {
      t.fail()
    }
  }

  $$register({ Component })

  t.throws(() => new Component())
})

test('Throws when observing primitive props', t => {
  const { $$register, state } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    dispose() {}

    ['observe val']() {
      t.fail()
    }
  }

  $$register({ Component })

  t.throws(() => new Component({ val: state.prop.value }), {
    message: `You are passing down 'val' as a prop to the 'Component' component but it is a primitive value in the store and can't be passed down as a prop. Consider passing its parent object as a prop instead and you can still observe the primitive in the 'Component' component.`,
  })
})

test('Throws when observing invalid type in mapStateToProps', t => {
  const { $$register } = regie({ initialState: { prop: { value: null } } })

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    mapStateToProps() {
      return {
        value: new Date(),
      }
    }

    dispose() {}

    ['observe value']() {
      t.fail()
    }
  }

  $$register({ Component })

  t.throws(() => new Component(), {
    message: `Invalid type 'object' for 'value'. mapStateToProps should return an object whose properties are either strings or functions.`,
  })
})

test('Observe deep array changes with parent object overrides', t => {
  const { $$register, actions } = regie(
    {
      initialState: { val: { arr1: [32, 45], arr2: [1, 2], name: 'hello' } },
      actions: {
        setVal({ mutations }, val) {
          mutations.setVal(val)
        },
      },
      mutations: {
        setVal({ state }, val) {
          state.val = val
        },
      },
    },
    { deep: true },
  )
  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    mapStateToProps() {
      return {
        arr1: 'val.arr1',
        arr2: 'val.arr2',
        name: 'val.name',
      }
    }

    dispose() {}

    ['observe arr1'](arr1) {
      t.is(JSON.stringify(arr1), JSON.stringify([32, 5]))
    }

    ['observe arr2']() {
      t.fail()
    }

    ['observe name']() {
      t.fail()
    }
  }
  $$register({ Component })
  new Component()

  const newVal = { arr1: [32, 5], arr2: [1, 2], name: 'hello' }
  actions.setVal(newVal)
})

test("Triggering a state change in action handler shouldn't trigger a new update batch", t => {
  class AnotherComponent {
    constructor(props) {
      this.props = props || {}
      this.created()
      this.onAfterRender()
    }
    created() {
      this.createdHooks()
    }
    onAfterRender() {
      actions.setCounter('increase')
    }
    dispose() {}
  }
  const { $$register, actions, state } = regie(
    {
      initialState: {
        counter: {
          count: 0,
        },
        unrelatedState: {
          state: 'idle', // off, disconnected
          error: {},
        },
      },
      actions: {
        setUnrelatedState({ mutations }) {
          mutations.setUnrelatedState('disconnected', {
            code: '324',
            key: 'fbz',
            someBoolean: true,
            title: 'foo',
            body: 'bar',
            cta: 'baz',
          })
        },
        setCounter({ mutations }, operation) {
          operation == 'increase' ? mutations.setCounter(1) : mutations.setCounter(-1)
        },
      },
      mutations: {
        setUnrelatedState({ state }, status, error) {
          state.unrelatedState = {
            state: status,
            error: error || {},
          }
        },
        setCounter({ state }, count) {
          state.counter.count += count
        },
      },
    },
    { deep: true },
  )

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }
    created() {
      this.createdHooks()
    }
    dispose() {}
    ['observe unrelatedState.state'](/* state */) {
      t.pass()

      $$register({ Component: AnotherComponent })
      new AnotherComponent()
    }
  }

  $$register({ Component })
  new Component({ unrelatedState: state.unrelatedState })
  actions.setUnrelatedState()
})

test('Props of children components should update to the appropriate value when those props are overridden in the parent', t => {
  class FirstComponent {
    constructor(props) {
      this.props = props || {}
      this.created()
    }
    created() {
      this.createdHooks()
      $$register({ Component: SecondComponent })

      new SecondComponent({
        prop1: this.props.prop1,
        prop2: this.props.prop2,
        prop3: this.props.prop3,
      })
    }
    dispose() {}
  }

  class SecondComponent {
    constructor(props) {
      this.props = props || {}
      this.created()
    }
    created() {
      this.createdHooks()
    }
    dispose() {}
    ['observe prop1.prop4'](/* prop4, change */) {
      $$register({ Component: ThirdComponent })
      new ThirdComponent(this.props)
    }
  }

  class ThirdComponent {
    constructor(props) {
      this.props = props || {}
      this.created()
    }
    created() {
      this.createdHooks()
    }
    dispose() {}
    ['observe prop2.prop5'](/* prop5, change */) {
      t.is(state.prop3.val2[0], this.props.prop3.val2[0])
    }
  }

  const { $$register, actions, state } = regie(
    {
      initialState: {
        prop1: {
          prop4: 'val1',
        },
        prop2: {
          prop5: null,
        },
        prop3: {
          val2: [45, 56],
        },
      },
      actions: {
        setProp4({ mutations }) {
          mutations.setProp4('val3')
        },
        setProp2({ mutations }, val) {
          mutations.setProp2(val)
        },
        setProp3({ mutations }, val) {
          mutations.setProp3(val)
        },
      },
      mutations: {
        setProp4({ state }, value) {
          state.prop1.prop4 = value
        },
        setProp2({ state }, val) {
          state.prop2 = { prop5: val }
        },
        setProp3({ state }, val) {
          state.prop3 = val
        },
      },
    },
    { deep: true },
  )
  $$register({ Component: FirstComponent })

  new FirstComponent({
    prop1: state.prop1,
    prop2: state.prop2,
    prop3: state.prop3,
  })

  actions.setProp4()

  actions.setProp3({
    val2: [32, 43],
  })

  actions.setProp2({
    val4: 'val5',
    val6: {
      prop1: 'one thing',
      prop2: 'another thing',
    },
  })
})

test('Observe deep array element changes', t => {
  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }
    created() {
      this.createdHooks()
    }
    ['observe prop1.status'](/* status, change */) {
      t.is(state.prop1.status[1].prop3.active, true)
    }
    dispose() {}
  }
  const { $$register, actions, state } = regie(
    {
      initialState: {
        prop1: {
          status: [{ prop2: { active: false } }, { prop3: { active: false } }],
        },
      },
      actions: {
        setProp3({ mutations }, value) {
          mutations.setProp3Active(value)
        },
      },
      mutations: {
        setProp3Active({ state }, value) {
          state.prop1.status[1].prop3.active = value
        },
      },
    },
    { deep: true },
  )

  $$register({ Component })

  new Component({
    prop1: state.prop1,
  })

  actions.setProp3(true)
})

test('Multiple instances of the same component can observe state change with mapState method mapper independently', t => {
  t.plan(1)

  const { $$register, state } = regie({ initialState: { prop: [0, 0] } }, { deep: true })

  const newValue = Math.random()

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    mapStateToProps() {
      return {
        value: state => state.prop[this.props.key],
      }
    }

    ['observe value'](newVal) {
      if (this.props.key == 1) t.fail()
      t.is(newValue, newVal)
    }

    dispose() {}
  }

  $$register({ Component })
  new Component({ key: 0 })
  new Component({ key: 1 })

  state.prop[0] = newValue
})

test('Child class instances of a parent component can observe state change with mapState method mapper', t => {
  t.plan(1)

  const { $$register, state } = regie({ initialState: { prop: [0, 0] } }, { deep: true })

  const newValue = Math.random()

  class Component {
    constructor(props) {
      this.props = props || {}
      this.created()
    }

    created() {
      this.createdHooks()
    }

    dispose() {}
  }

  class ChildComponent extends Component {
    ['observe value'](newVal) {
      if (this.props.key == 1) t.fail()
      t.is(newValue, newVal)
    }
    mapStateToProps() {
      return {
        value: state => state.prop[this.props.key],
      }
    }
  }

  class GrandchildComponent extends ChildComponent {}

  $$register({ Component })
  new GrandchildComponent({ key: 0 })

  state.prop[0] = newValue
})
