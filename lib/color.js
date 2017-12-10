const chalk = require('chalk')

const {
  red, green, yellow,
  hex, rgb, keyword
} = chalk

const eval = keyword.bind(chalk)
const blue = eval('lightblue')
const orange = eval('orange')
const purple = eval('purple')

module.exports = {
  red, green, blue,
  orange, yellow, purple,

  hex, eval
}

