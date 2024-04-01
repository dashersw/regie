const regie = require('./')
const newVal = { location: [32, 5], battery: [10, 32], rid: 'hello' }
const { $$register, state, actions } = regie(
  {
    initialState: { scooter: { location: [32, 45], battery: [10, 32], rid: 'hello' } },
    actions: {
      setScooter({ mutations }, val) {
        mutations.setVal(val)
      },
    },
    mutations: {
      setVal({ state }, val) {
        state.scooter = val
      },
    },
  },
  { deep: true },
)
class Component {
  constructor(props = {}) {
    console.log('here are props', props)
    this.props = props
    this.created()
  }
  created() {
    this.createdHooks()
  }
  dispose() {}
  ['observe scooter.location'](location) {
    console.log('scooter.location changed')
    console.log(location, newVal.location)
    // t.end()
  }
  ['observe scooter.rid']() {
    console.log('scooter.rid changed')
    // t.fail()
  }
  ['observe scooter.battery']() {
    console.log('scooter.battery changed')
    // t.fail()
  }
}
$$register({ Component })
console.log('state', state)
console.log('state', state.scooter)
const cmp = new Component({ scooter: state.scooter })

console.log(cmp.props.scooter)
actions.setScooter(newVal)
