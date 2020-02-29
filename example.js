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
  constructor (props) {
    this.props = props
    this.created()
  }

  mapStateToProps () {
    return {
      stringValue: 'navigation.status.value',
      methodValue: state => state.navigation.status.value
    }
  }

  created () {
    this.createdHooks()
  }

  ['observe stringValue'] (newValue, change) {
    console.log('stringValue', newValue, change)
  }

  ['observe methodValue'] (newValue, change) {
    console.log('methodValue', newValue, change)
  }
}

$$register({ Component })
const comp = new Component({ hello: true })
console.log(comp.props.navStatus)

state.navigation = { status: { value: 7 } }
console.log(comp.props.navStatus)

state.navigation.status = { value: 3 }
console.log(comp.props.navStatus)

comp.props.navStatus = 11 // throws an error
