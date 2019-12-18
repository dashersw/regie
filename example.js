/* eslint-disable no-new */

const regie = require('.')

const initialState = {
  navigation: {}
}

const { state, observe, $$register } = regie({ initialState }, { deep: true })

observe('navigation.status.value', (newValue, change) => {
  console.log('ust', 'nv', newValue, 'c', change.newValue, '====')
})

observe('navigation.status', (newValue, change) => {
  console.log('alt', 'nv', newValue, 'c', change.newValue, '===')
})

state.navigation = { status: { value: 3 } }
state.navigation = { status: { value: 10 } }

class Component {
  constructor () {
    this.created()
  }

  created () {
    this.createdHooks()
  }

  ['mapState navigation.status.value'] (newValue, change) {
    console.log('yay', JSON.stringify(newValue))
  }

  dispose () { }
}

$$register({ Component })
new Component()

state.navigation = { status: { value: 5 } }
state.navigation.status = { value: 3 }
