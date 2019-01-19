const regie = require('.')

const initialState = {
  items: []
}

const { state, observe } = regie({ initialState })

const items = state.items

observe(() => items, (val) => console.log('updated items', val))
observe(() => items[2].details, val => console.log('updated details', val))

const off = observe(() => items[2].details[2].name, val => console.log('off', val))

items.push({ details: [{ name: 0 }, { name: 1 }] })
items.push({ details: [{ name: 2 }, { name: 3 }] })
items.push({ details: [{ name: 3 }, { name: 4 }] })

let details = items[2].details
const off2 = observe(() => details[2].name, val => console.log('off2', val))

items[2].details = [{ name: 4 }, { name: 5 }]
details = items[2].details

details.push({ name: 10 })
details.push({ name: 7 })
details[2].name = 8
details[2].name = 8
details[2].name = 8
details[2].name = 9
details[2].name = 9
off()
details[2].name = 10
details[2].name = 10
details[2].name = 10
details[2].name = 11
off2()
details[2].name = 12
