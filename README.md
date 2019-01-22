# regie
**An observable state management tool for vanilla JS applications based on Proxies**

## Installation

```bash
npm i regie
```

## Example

```js
const regie = require('regie')

const initialState = {
  items: []
}

const { state, observe } = regie({ initialState })

observe(state.items, (newValue, change) => {
  console.log(`new value is ${newValue} with change:`, change)
})

state.items.push('first!')
```

`observe` function accepts many forms, including a string path and a predicate. All of the following are the same:

```js
observe(state.items, handler)
observe(state => state.items, handler)
observe(() => state.items, handler)
observe('items', handler)

const items = state.items
observe(items, handler)
observe(() => items, handler)
```

regie also allows you to watch primitive values in a certain form. The following examples observe the _future_ first element of the array:

```js
observe(() => state.items[0], handler)
observe('items.0', handler)
```

and the following examples observe _even farther into the future_ details of the first element of the array:

```js
observe(() => state.items[0].name, handler)
observe('items.0.name', handler)
```

## License

MIT License

Copyright (c) 2019 Armagan Amcalar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
