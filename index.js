const slim = require('observable-slim')
const EventEmitter = require('events')
const get = require('lodash.get')
const register = require('./lib/register')
const bindCollection = require('./lib/bindCollection')

module.exports = ({ initialState = {}, actions = {}, mutations = {} }) => {
  const bus = new EventEmitter()

  const state = slim.create(initialState, false, (changes) => {
    changes.forEach(change => {
      if (change.type == 'update' && change.property == 'length' && Array.isArray(change.target) && change.target.length == change.newValue)
        return

      const paths = change.currentPath.split('.')
      while (paths.length) {
        const path = paths.join('.')
        if (path in bus._events) {
          bus.emit(path, get(state, path), change)
        }
        paths.pop()
      }

      bus.emit('root', state, change)
    })
  })

  function observeLater(mapper, handler) {
    let off

    function observer(value, change) {
      let val
      try {
        val = mapper()
      } catch (e) {
        if (mapper.lastValue) handler()
        mapper.lastValue = undefined
        return
      }

      if (val && val.__getPath) {
        bus.removeListener('root', observer)
        handler(mapper())
        off = observe(mapper, handler)
        return
      } else if (val) {
        if (!mapper.lastValue || mapper.lastValue != val) {
          handler(val)
        }
        else if (change.newValue === val) {
          bus.removeListener('root', observer)
          handler(val)
          off = observe(change.currentPath, handler)
        }
        mapper.lastValue = val
      }
    }

    bus.on('root', observer)
    off = () => bus.removeListener('root', observer)
    return () => off()
  }

  function observe(mapper, handler) {
    if (typeof mapper == 'string') {
      bus.on(mapper, handler)
      return () => bus.removeListener(mapper, handler)
    }

    let val

    try {
      val = mapper()
    } catch (e) {
      return observeLater(mapper, handler)
    }

    mapper.lastValue = val

    if (val && val.__getPath) {
      bus.on(val.__getPath, handler)
      return () => bus.removeListener(val.__getPath, handler)
    }

    return observeLater(mapper, handler)
  }

  const boundRegister = register(observe)
  const boundActions = Object.keys(actions).map(key => [key, actions[key].bind({ actions, mutations })])
  const boundMutations = Object.keys(actions).map(key => [key, actions[key].bind({ state, mutations })])

  return {
    state,
    observe,
    $$register: boundRegister,
    actions: bindCollection(boundActions),
    mutations: bindCollection(boundMutations)
  }
}
