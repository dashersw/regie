import test from 'ava'

import regie from '../'

test.beforeEach(t => {
  t.context.store = regie({
    initialState: {
      val: Math.random(),
      arr: []
    }
  })
  t.context.value = Math.random()
})

test.cb('Observe existing primitive value with mapper function with no arguments', t => {
  const { state, observe } = t.context.store

  observe(() => state.val, val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.val = t.context.value
})

test.cb('Observe existing primitive value with mapper function with state argument', t => {
  const { state, observe } = t.context.store

  observe(state => state.val, val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.val = t.context.value
})

test.cb('Observe existing primitive value with path string', t => {
  const { state, observe } = t.context.store

  observe('val', val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.val = t.context.value
})

test.cb('Observe existing primitive child of parent with mapper function', t => {
  const { state, observe } = t.context.store

  observe(() => state.val.val, val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.val = {
    val: t.context.value
  }
})

test.cb('Observe existing array with reference', t => {
  const { state, observe } = t.context.store

  observe(state.arr, val => {
    t.is(val[0], t.context.value)
    t.end()
  })

  state.arr.push(t.context.value)
})

test.cb('Observe new values in existing array with mapper function', t => {
  const { state, observe } = t.context.store

  observe(() => state.arr[0], val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.arr.push(t.context.value)
})

test.cb('Observe values in existing array that will disappear with mapper function', t => {
  const { state, observe } = t.context.store
  state.arr.push(t.context.value)

  const val1 = Math.random()
  const val2 = undefined

  let counter = 0

  observe(() => state.arr[0], val => {
    const checkValue = counter ? val2 : val1

    t.is(val, checkValue)
    if (counter) t.end()

    counter++
  })

  state.arr[0] = val1
  state.arr = null
})

test.cb('Observe existing array value and get notified with undefined when it\'s pop()\'ped', t => {
  const { state, observe } = t.context.store

  state.arr.push(t.context.value, 3)

  observe(() => state.arr[1], val => {
    t.is(val, undefined)
    t.end()
  })

  state.arr.pop()
})

test('Turn off observation listener', t => {
  const { state, observe } = t.context.store

  function stub () { stub.called = true }

  const off = observe(() => state.val, stub)
  off()

  state.val = t.context.value

  t.falsy(stub.called)
})

test('Turn off observation listener for future values', t => {
  const { state, observe } = t.context.store

  function stub () { stub.called++ }
  stub.called = 0

  const off = observe(() => state.arr2, stub)
  state.arr2 = []
  off()
  state.arr2 = []

  t.is(stub.called, 1)
})
