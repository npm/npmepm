const oboe = require('oboe')
const path = require('path')
const chalk = require('chalk')
const bundle = require('../lib/bundle')

// Summon the colors.
const {red} = chalk

// Program runner.
function runPs (bundlePath, {extractor, handler}) {
  let nodeCount = 0
  let runCount = 0

  bundle(path.resolve(bundlePath))
    .on('error', error => {
      console.error(red(`Error reading ${bundlePath} :`), error)
    })
    .on('file', ({next, path, skip, stream}) => {
      if (path.endsWith('daemon/docker/docker_ps_a.json')) {
        oboe(stream())
          .node('!.*', node => {
          // Visit every top-level node in the array.
            nodeCount++

            if (node.State === 'running') {
              runCount++
            }

            // Forward only the desired subset of the node's data.
            return extractor ? extractor(node) : node
          })
          .done(nodes => {
            handler({nodes, nodeCount, runCount})
            next()
          })
          .fail(error => {
            console.error(red(`Error reading ${path} :`), error)
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
