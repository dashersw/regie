module.exports = observe => ({ Component }) => {
  Component.prototype.__regie_changes__ = Component.prototype.__regie_changes__ || []

  const originalHook = Component.prototype.createdHooks

  Component.prototype.createdHooks = function () {
    let changes = this.constructor.prototype.__regie_changes__

    if (!changes.length) {
      changes = []

      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      const observeMethods = methods.filter(x => x.startsWith('observe'))
      const mapStateMethods = methods.filter(x => x.startsWith('mapState'))

      observeMethods
        .forEach(method => {
          const path = method.slice(8)
          changes.push([comp => {
            const [firstPath, ...restPath] = path.split('.')
            if (!(firstPath in comp.props)) {
              throw new Error(`Trying to observe '${firstPath}' prop in the '${comp.constructor.name}' component but it hasn't been passed down as a prop during instantiation.`)
            }
            if (!(comp.props[firstPath] && comp.props[firstPath].__getPath)) {
              throw new Error(`You are passing down '${firstPath}' as a prop to the '${comp.constructor.name}' component but it is a primitive value in the store and can't be passed down as a prop. Consider passing its parent object as a prop instead and you can still observe the primitive in the '${comp.constructor.name}' component.`)
            }
            return comp.props[firstPath].__getPath.split('.').concat(restPath).join('.')
          }, comp => comp[method].bind(comp)])
        })

      mapStateMethods
        .forEach(method => {
          const path = method.slice(9)
          if (!path.trim()) {
            throw new Error(`Can't map empty state in '${this.constructor.name}' component`)
          }
          changes.push([comp => path, comp => comp[method].bind(comp)])
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
