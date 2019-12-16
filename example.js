const regie = require('.')

const initialState = {
  navigation: {}
}

const { state, observe } = regie({ initialState })

observe('navigation.status.value', (newValue, change) => {
  console.log('ust', 'nv', newValue, 'c', change.newValue, '====')
})

observe('navigation.status', (newValue, change) => {
  console.log('alt', 'nv', newValue, 'c', change.newValue, '===')
})

state.navigation = { status: { value: 3 } }
state.navigation = { status: { value: 10 } }
