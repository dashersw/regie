import test from 'ava'

import regie from '../'

test.beforeEach(t => {
  t.context.store = regie()
  t.context.value = Math.random()
})

test.cb('Observe future primitive value with mapper function with no arguments', t => {
  const { state, observe } = t.context.store

  observe(() => state.val, val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.val = t.context.value
})

test.cb('Observe future primitive value with mapper function with state argument', t => {
  const { state, observe } = t.context.store

  observe(state => state.val, val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.val = t.context.value
})

test.cb('Observe future primitive value with path string', t => {
  const { state, observe } = t.context.store

  observe('val', val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.val = t.context.value
})

test.cb('Observe future primitive child of parent with mapper function', t => {
  const { state, observe } = t.context.store

  observe(() => state.val.val, val => {
    t.is(val, t.context.value)
    t.end()
  })

  state.val = {
    val: t.context.value
  }
})

test.cb('Observe future value of parent with mapper function and use its proxy once it\'s available', t => {
  const { state, observe } = t.context.store

  const val1 = Math.random()
  const val2 = Math.random()

  let counter = 0

  observe(() => state.val.val.val, val => {
    const checkValue = counter ? val2 : val1

    t.is(val, checkValue)
    if (counter) t.end()

    counter++
  })
  state.val = {}
  state.val.val = {}

  state.val.val.val = val1
  state.val.val.val = val2
})

test.cb('Observe future array of parent with mapper function and use its proxy once it\'s available', t => {
  const { state, observe } = t.context.store

  const val1 = Math.random()
  const val2 = Math.random()

  let counter = 0

  observe(() => state.val.val, val => {
    const checkValue = counter ? val2 : val1

    t.is(val[0], checkValue)
    if (counter) t.end()

    counter++
  })
  state.val = {}

  state.val.val = [val1]
  state.val.val = [val2]
})

test.cb.skip('Observe future array of parent with mapper function and use its proxy once it\'s available even if something else changes', t => {
  const { state, observe } = t.context.store

  const val1 = Math.random()

  observe('val.val', val => {
    t.is(val, val1)
    t.end()
  })

  state.val = {
    val: val1
  }
  state.val.sdf = []
  state.val.sdf = [2]
})
