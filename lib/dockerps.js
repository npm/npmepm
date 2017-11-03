const P = require('bluebird')
const fs = require('fs')
const sh = require('shelljs')
const oboe = require('oboe')
const path = require('path')
const chalk = require('chalk')

// Summon the colors.
const {red, green} = chalk
const blue = chalk.keyword('lightblue')
const yellow = chalk.keyword('yellow')
const orange = chalk.keyword('orange')

const fileExists = P.promisify(fs.exists)

// Display message and/or help and exit.
function bail (message, options) {
  const {code, showHelp} = {
    code: 1,
    showHelp: false,
    ...options
  }

  if (message) console.error(message)
  if (showHelp) yargs.showHelp()

  process.exit(code)
}

// Program runner.
function runPs (dir, {extractor, handler}) {
  const bundleDir = path.resolve(dir)

  if (!sh.test('-e', bundleDir)) bail(`${bundleDir}: ${red('path does not exist')}`)
  if (!sh.test('-d', bundleDir)) bail(`${bundleDir}: ${red('path is not a directory')}`)

  const psFile = path.resolve(bundleDir, 'daemon/docker/docker_ps_a.json')

  if (!sh.test('-e', psFile)) bail(`${psFile}: ${red('path does not exist')}`)
  if (!sh.test('-f', psFile)) bail(`${psFile}: ${red('path is not a file')}`)

  let nodeCount = 0

  oboe(fs.createReadStream(psFile))
  .node('!.*', node => {
    // Visit every top-level node in the array.
    nodeCount += 1

    // Forward only the desired subset of the node's data.
    return extractor ? extractor(node) : node
  })
  .done(nodes => handler({nodes, nodeCount}))
  .fail(error => {
    console.error(red(`Error reading ${psFile} :`), error)
  })
}

module.exports = {
  runPs
}
