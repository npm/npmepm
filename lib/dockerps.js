const fs = require('fs')
const sh = require('shelljs')
const oboe = require('oboe')
const path = require('path')
const chalk = require('chalk')

// Summon the colors.
const {red} = chalk

// Display message and/or help and exit.
function bail (message, options) {
  const {code, showHelp} = {
    code: 1,
    showHelp: false,
    ...options
  }

  if (message) console.error(message)
  if (showHelp) require('yargs').showHelp()

  process.exit(code)
}

// Program runner.
function runPs (bundlePath, {extractor, handler}) {
  const bundle = path.resolve(bundlePath)

  if (!sh.test('-e', bundle)) bail(`${bundle}: ${red('path does not exist')}`)
  if (!sh.test('-d', bundle)) bail(`${bundle}: ${red('path is not a directory')}`)

  const psFile = path.resolve(bundle, 'daemon/docker/docker_ps_a.json')

  if (!sh.test('-e', psFile)) bail(`${psFile}: ${red('path does not exist')}`)
  if (!sh.test('-f', psFile)) bail(`${psFile}: ${red('path is not a file')}`)

  let nodeCount = 0
  let runCount = 0
  let sampleNode

  oboe(fs.createReadStream(psFile))
    .node('!.*', node => {
    // Visit every top-level node in the array.
      nodeCount++

      if (node.State === 'running') {
        runCount++
        if (runCount === 2) {
          sampleNode = node
        }
      }

      // Forward only the desired subset of the node's data.
      return extractor ? extractor(node) : node
    })
    .done(nodes => {
      handler({nodes, nodeCount})
      console.log(JSON.stringify(sampleNode, null, 2))
    })
    .fail(error => {
      console.error(red(`Error reading ${psFile} :`), error)
    })
}

module.exports = {
  runPs
}
