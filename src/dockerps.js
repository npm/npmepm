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
  compose,
  equals,
  flatten,
  groupBy,
  groupWith,
  head,
  last,
  map,
  prepend,
  reduce,
  sortBy,
  split,
  toPairs,
  values
} = require('ramda')

// Colors
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

// Containers listing sorted by age.
const containersByAge = {
  extractor: ({Id: id, Image: image, State: state, Created: created}) => ({
    id, image, state,
    created: new Date(created * 1000).toISOString()
  }),
  handler: ({nodes, nodeCount}) => {
    const selector = ({created}) => created
    const convertToRow = ({created, image, state, id}) => [id, image, state, created]
    const headers = ['ID', 'Image', 'State', 'Created']

    const rows = compose(
      prepend(headers),
      map(convertToRow),
      sortBy(selector)
    )(nodes)

    console.log(table(rows))
    console.log(green(`Processed ${nodeCount} nodes.`))
  }
}

// Listing of images grouped by id.
const imageCounts = {
  extractor: ({Id: id, Image: image}) => ({id, image}),
  handler: ({nodes, nodeCount}) => {
    const selector = ({image}) => image
    const grouper = (a, b) => equals(a.image, b.image)
    const convertToRow = group => [head(group).image, group.length]
    const headers = ['Image', 'Container Count']

    const rows = compose(
      prepend(headers),
      map(values),
      map(convertToRow),
      groupWith(grouper),
      sortBy(selector)
    )(nodes)

    console.log(table(rows))
    console.log(green(`Processed ${nodeCount} nodes.`))
  }
}

// Listing images grouped by id and state.
const imageStateCounts = {
  extractor: ({Id: id, Image: image, State: state}) => ({id, image, state}),
  handler: ({nodes, nodeCount}) => {
    const selector = ({image, state}) => ([image, state])
    const grouper = (a, b) => equals(selector(a), selector(b))
    const convertToRow = group => {
      const {image, state} = head(group)
      return [image, state, group.length]
    }
    const headers = ['Image', 'State', 'Container Count']

    const rows = compose(
      prepend(headers),
      map(values),
      map(convertToRow),
      groupWith(grouper),
      sortBy(selector)
    )(nodes)

    console.log(table(rows))
    console.log(green(`Processed ${nodeCount} nodes.`))
  }
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

const yargBuilder = (yargs) => yargs.positional('<bundle-dir>', {type: 'string'})
const runner = (options) => ({bundleDir}) => runPs(bundleDir, options)

const args = require('yargs')
  .command('image-counts <bundle-dir>', 'List images grouped by id', yargBuilder, runner(imageCounts))
  .command('image-state-counts <bundle-dir>', 'List images grouped by id and state', yargBuilder, runner(imageStateCounts))
  .command('containers-by-age <bundle-dir>', 'List containers ordered by age', yargBuilder, runner(containersByAge))
  .help('help')
  .alias('help', 'h')
  .argv
