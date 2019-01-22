const get = require('lodash.get')

module.exports = observe => ({ Component }) => {
  Component.prototype.__regie_changes__ = []

  Component.prototype.created = function () {
    let changes = this.constructor.prototype.__regie_changes__

    if (!changes.length) {
      changes = []

      Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        .filter(x => x.startsWith('observe'))
        .forEach(method => {
          const path = method.slice(8)
          changes.push([() => get(this.props, path), this[method].bind(this)])
        })

      this.constructor.prototype.__regie_changes__ = changes
    }

    changes.forEach(([mapper, handler]) => {
      observe(mapper, handler.bind(this))
    })
  }

}
