const get = require('lodash.get')

module.exports = (observe, state) => ({ Component }) => {
  const originalHook = Component.prototype.createdHooks

  Component.prototype.createdHooks = function () {
    this.__regie_observer_removers__ = []

    for (let propName in this.props) {
      if (this.props[propName] == null || typeof this.props[propName] == 'undefined') continue

      // Update props when the values passed down are overridden at the root

      const path = this.props[propName].__getPath
      if (!path) continue

      this.__regie_observer_removers__.push(
        observe(path, newValue => {
          this.props[propName] = newValue
        })
      )
    }

    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    const observeMethods = methods.filter(x => x.startsWith('observe'))
    const mapStateMethods = (this.mapStateToProps && this.mapStateToProps()) || {}

    Object.keys(mapStateMethods).forEach(method => {
      const observeMethodsForMappedState = observeMethods.filter(m => m.slice(8) == method)

      let observer

      if (typeof mapStateMethods[method] == 'string') {
        // propValue = get(state, mapStateMethods[method])
        observer = () => get(state, mapStateMethods[method])
      } else if (typeof mapStateMethods[method] == 'function') {
        try {
          observer = mapStateMethods[method].bind(this, state)
        } catch (e) {}
      } else {
        throw new Error(
          `Invalid type '${typeof mapStateMethods[method]}' for '${method}'. mapStateToProps should return an object whose properties are either strings or functions.`
        )
      }

      let propValue

      this.__regie_observer_removers__.push(
        observe(observer, (newValue, change) => {
          propValue = newValue
          observeMethodsForMappedState.forEach(m => this[m](newValue, change))
        })
      )

      propValue = observer.lastValue

      Object.defineProperty(this.props, method, {
        get: () => propValue,
        set: newValue => {
          throw new Error(`Refusing to update '${method}' to ${newValue}. Please use a mutation to mutate the state.`)
        }
      })
    })

    observeMethods.forEach(method => {
      const path = method.slice(8)

      const [firstPath, ...restPath] = path.split('.')
      if (path in mapStateMethods) {
        return
      } else if (!(firstPath in this.props)) {
        throw new Error(
          `Trying to observe '${firstPath}' prop in the '${this.constructor.name}' component but it hasn't been passed down as a prop during instantiation.`
        )
      } else if (!(this.props[firstPath] && this.props[firstPath].__getPath)) {
        throw new Error(
          `You are passing down '${firstPath}' as a prop to the '${this.constructor.name}' component but it is a primitive value in the store and can't be passed down as a prop. Consider passing its parent object as a prop instead and you can still observe the primitive in the '${this.constructor.name}' component.`
        )
      }

      this.__regie_observer_removers__.push(
        observe(this.props[firstPath].__getPath.split('.').concat(restPath).join('.'), this[method].bind(this))
      )
    })

    originalHook && originalHook.call(this)
  }

  const originalDispose = Component.prototype.dispose

  Component.prototype.dispose = function () {
    this.__regie_observer_removers__.forEach(removeObserver => removeObserver())

    originalDispose.call(this)
  }
}
