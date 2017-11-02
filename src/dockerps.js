/**
 * Break down the results of the docker PS in an npme support bundle.
 */

const P = require('bluebird')
const fs = require('fs')
const sh = require('shelljs')
const oboe = require('oboe')
const path = require('path')
const chalk = require('chalk')
const {table} = require('table')

const {
  equals, flatten, groupBy, groupWith, head, last, map, prepend, reduce, sortBy, split, toPairs, values
} = require('ramda')

// Colors
const {red, green} = chalk
const blue = chalk.keyword('lightblue')
const yellow = chalk.keyword('yellow')
const orange = chalk.keyword('orange')

const fileExists = P.promisify(fs.exists)

const defaultBailOptions = {
  code: 1,
  showHelp: false
}

function bail(message, options) {
  const {code, showHelp} = {...defaultBailOptions, ...options}
  if (message) console.error(message)
  if (showHelp) yargs.showHelp()
  process.exit(code)
}

//const yargBuilder = (yargs) => yargs.positional('<bundle-dir>', {type: string})

const yargs = require('yargs')
  .usage('$0 <bundle-dir>')
  //.usage('$0 <command> <bundle-dir>')
  //.command('image-counts', 'List the number of containers for each image', yargBuilder, (grr) => runPs(grr.bundleDir, imageCounts))
  //.command('image-state-counts', 'List the number of containers ', yargBuilder, (grr) => runPs(grr.bundleDir, imageCounts))
  //.command('containers-by-age', '', yargBuilder,  (grr) => runPs(grr.bundleDir, containersByAge))
  .help('help')
  .alias('help', 'h')

const args = yargs.argv

if (args._.length != 1) bail(null, {showHelp: true})

const bundleDir = path.resolve(head(args._))

if (!sh.test('-e', bundleDir)) bail(`${bundleDir}: ${red('path does not exist')}`)
if (!sh.test('-d', bundleDir)) bail(`${bundleDir}: ${red('path is not a directory')}`)

const psFile = path.resolve(bundleDir, 'daemon/docker/docker_ps_a.json')

if (!sh.test('-e', psFile)) bail(`${psFile}: ${red('path does not exist')}`)
if (!sh.test('-f', psFile)) bail(`${psFile}: ${red('path is not a file')}`)

let nodeCount = 0

oboe(fs.createReadStream(psFile))
.node('!.*', node => {
  // Visit every top-level node in the array.
  const {Id: id, Image: image, State: state} = node
  nodeCount += 1

  if (nodeCount == 1) {
    console.log(JSON.stringify(node, null, 2))
  }

  // Forward only a subset of the node's data.
  return {
    id, image, state
  }
})
.done(nodes => {
  const sorted = sortBy(({image, state}) => ([image, state]))(nodes)

  const comp = ({image, state}) => ([image, state])
  const groups = groupWith((a, b) => equals(comp(a), comp(b)))(sorted)

  const typeCounts = map(group => [head(group).image, head(group).state, group.length])(groups)
  console.log(table(prepend(['Image', 'State', 'Container Count'])(sortBy(x => x)(map(values)(typeCounts)))))
  console.log(green(`Processed ${nodeCount} nodes.`))
})
.fail(error => {
  console.error(red(`Error reading ${psFile} :`), error)
})
