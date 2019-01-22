const get = require('lodash.get')

module.exports = observe => ({ Component }) => {
  Component.prototype.__regie_changes__ = Component.prototype.__regie_changes__ || []

  Component.prototype.created = function () {
    let changes = this.constructor.prototype.__regie_changes__

    if (!changes.length) {
      changes = []

      Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        .filter(x => x.startsWith('observe'))
        .forEach(method => {
          const path = method.slice(8)
          changes.push([comp => () => get(comp.props, path), comp => comp[method].bind(comp) ])
        })

      this.constructor.prototype.__regie_changes__ = changes
    }

    changes.forEach(([mapperProducer, handlerProducer]) => {
      observe(mapperProducer(this), handlerProducer(this))
    })
  }
}
