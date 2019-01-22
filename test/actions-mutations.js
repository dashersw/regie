import test from 'ava'

import regie from '..'

test.cb('Access actions when defined', t => {
  const { actions } = regie({
    actions: {
      increment () {
        t.pass()
        t.end()
      }
    }
  })

  actions.increment()
})

test.cb('Call mutation from an action', t => {
  const { actions } = regie({
    actions: {
      setValue ({ mutations }) {
        mutations.setValue()
      }
    },
    mutations: {
      setValue () {
        t.pass()
        t.end()
      }
    }
  })

  actions.setValue()
})

test.cb('Observe state updated by a mutation through an action', t => {
  const val = Math.random()

  const { actions, observe, state } = regie({
    actions: {
      setValue ({ mutations }, val) {
        mutations.setValue(val)
      }
    },
    mutations: {
      setValue ({ state }, val) {
        state.val = val
      }
    }
  })

  observe(() => state.val, newValue => {
    t.is(newValue, val)
    t.end()
  })

  actions.setValue(val)
})
