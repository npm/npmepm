const fs = require('fs')
const sh = require('shelljs')
const oboe = require('oboe')
const path = require('path')
const chalk = require('chalk')
const bundle = require('../lib/bundle')

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
  let nodeCount = 0
  let runCount = 0
  let sampleNode

  bundle(path.resolve(bundlePath))
  .on('error', error => {
    console.error(red(`Error reading ${psFile} :`), error)
  })
  .on('file', ({next, path, skip, stream}) => {
    if (path.endsWith('daemon/docker/docker_ps_a.json')) {
      oboe(stream())
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
          //console.log(JSON.stringify(sampleNode, null, 2))
          next()
        })
        .fail(error => {
          console.error(red(`Error reading ${psFile} :`), error)
        })
    } else {
      skip()
    }
  })
  .once('end', () => {
  })
}

module.exports = {
  runPs
}
