module.exports = (arr) => {
  const rv = {}

  arr.forEach(([key, handler]) => rv[key] = handler)
  return rv
}
