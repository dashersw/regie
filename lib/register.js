const get = require('lodash.get')

module.exports = (observe, state) => ({ Component }) => {
  Component.prototype.__regie_changes__ = Component.prototype.__regie_changes__ || []

  const originalHook = Component.prototype.createdHooks

  Component.prototype.createdHooks = function () {
    let changes = this.constructor.prototype.__regie_changes__

    if (!changes.length) {
      changes = []

      for (let propName in this.props) {
        if (this.props[propName] == null || typeof this.props[propName] == 'undefined') continue

        // Update props when the values passed down are overridden at the root

        const path = this.props[propName].__getPath
        changes.unshift([ _ => path, cmp => newValue => {
          this.props[propName] = newValue
        }])
      }

      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      const observeMethods = methods.filter(x => x.startsWith('observe'))
      const mapStateMethods = (this.mapStateToProps && this.mapStateToProps()) || {}
      Object.keys(mapStateMethods)
        .forEach(method => {
          let propValue

          if (typeof mapStateMethods[method] == 'string') {
            propValue = get(state, mapStateMethods[method])
          } else if (typeof mapStateMethods[method] == 'function') {
            try {
              propValue = mapStateMethods[method](state)
            } catch (e) {}
          } else {
            throw new Error(`Invalid type '${typeof mapStateMethods[method]}' for '${method}'. mapStateToProps should return an object whose properties are either strings or functions.`)
          }

          Object.defineProperty(this.props, method, {
            get: () => propValue,
            set: newValue => {
              throw new Error(`Refusing to update '${method}' to ${newValue}. Please use a mutation to mutate the state.`)
            }
          })

          changes.push([comp => mapStateMethods[method], comp => (newValue, change) => {
            propValue = newValue
          }])
        })

      observeMethods
        .forEach(method => {
          const path = method.slice(8)
          changes.push([comp => {
            const [firstPath, ...restPath] = path.split('.')
            if (path in mapStateMethods) {
              if (typeof mapStateMethods[path] == 'string') {
                return mapStateMethods[path]
              } else { // if (typeof mapStateMethods[path] == 'function') { // removed due to line coverage error
                return state => mapStateMethods[path](state)
              }
            } else if (!(firstPath in comp.props)) {
              throw new Error(`Trying to observe '${firstPath}' prop in the '${comp.constructor.name}' component but it hasn't been passed down as a prop during instantiation.`)
            } else if (!(comp.props[firstPath] && comp.props[firstPath].__getPath)) {
              throw new Error(`You are passing down '${firstPath}' as a prop to the '${comp.constructor.name}' component but it is a primitive value in the store and can't be passed down as a prop. Consider passing its parent object as a prop instead and you can still observe the primitive in the '${comp.constructor.name}' component.`)
            }
            return comp.props[firstPath].__getPath.split('.').concat(restPath).join('.')
          }, comp => comp[method].bind(comp)])
        })

      this.constructor.prototype.__regie_changes__ = changes
    }

    this.__regie_observer_removers__ = changes.map(([mapperProducer, handlerProducer]) =>
      observe(mapperProducer(this), handlerProducer(this)))

    originalHook && originalHook.call(this)
  }

  const originalDispose = Component.prototype.dispose

  Component.prototype.dispose = function () {
    this.__regie_observer_removers__.forEach(removeObserver => removeObserver())

    originalDispose.call(this)
  }
}
