import anyTest, { TestFn } from 'ava'

const test = anyTest as TestFn<{ store: any; value: any }>

import regie from '../'

test('Access actions when defined', t => {
  const { actions } = regie({
    actions: {
      increment() {
        t.pass()
      },
    },
  })

  actions.increment()
})

test('Call mutation from an action', t => {
  const { actions } = regie({
    mutations: {
      setValue() {
        t.pass()
      },
    },
    actions: {
      setValue({ mutations }) {
        mutations.setValue()
      },
    },
  })

  actions.setValue()
})

test('Observe state updated by a mutation through an action', t => {
  const val = Math.random()

  const { actions, observe, state } = regie({
    initialState: {
      val: 0,
    },
    mutations: {
      setValue({ state }, val: number) {
        state.val = val
      },
    },
    actions: {
      setValue({ mutations }, val) {
        mutations.setValue(val)
      },
    },
  })

  observe(
    () => state.val,
    newValue => {
      t.is(newValue, val)
    },
  )

  actions.setValue(val)
})

test('Observe state deep change of an object', t => {
  const newVal = { prop1: 3, prop2: 2 }
  const { actions, observe, state } = regie({
    initialState: {
      val: { prop1: 1, prop2: 2 },
    },
    actions: {
      setValue({ mutations }, val) {
        mutations.setValue(val)
      },
    },
    mutations: {
      setValue({ state }, val) {
        state.val = val
      },
    },
  })

  observe(
    () => state.val.prop1,
    newValue => {
      t.is(newValue, newVal.prop1)
    },
  )

  observe(
    () => state.val.prop2,
    (newValue, change) => {
      t.fail()
    },
  )

  observe(
    () => state.val,
    newValue => {
      t.deepEqual(newValue, newVal)
    },
  )

  actions.setValue(newVal)
})
