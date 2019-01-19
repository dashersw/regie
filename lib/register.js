module.exports = observe => ({ Component }) => {
  Component.prototype.__regie_changes__ = []

  Component.prototype.created = function () {
    let changes = this.constructor.prototype.__regie_changes__

    if (!changes.length) {
      changes = []

      Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        .filter(x => x.startsWith('observe'))
        .forEach(method => {
          changes.push([() => get(this.props, path), this[method.slice(7)].bind(this)])
        })

      this.constructor.prototype.__regie_changes__ = changes
    }

    changes.forEach(([mapper, handler]) => {
      let mapperFn = mapper
      if (typeof mapper != 'function' && typeof mapper != 'string') mapperFn = () => mapper

      observe(mapperFn, handler.bind(this))
    })
  }

}
