const {runPs} = require('../lib/dockerps')
const {
  containersByAge,
  imageCounts,
  imageStateCounts
} = require('../lib/commands')

function run () {
  const yargBuilder = (yargs) => yargs.positional('<bundle-dir>', {type: 'string'})
  const runner = (options) => ({bundleDir}) => runPs(bundleDir, options)

  return require('yargs')
    .command('image-counts <bundle-dir>', 'List images grouped by id', yargBuilder, runner(imageCounts))
    .command('image-state-counts <bundle-dir>', 'List images grouped by id and state', yargBuilder, runner(imageStateCounts))
    .command('containers-by-age <bundle-dir>', 'List containers ordered by age', yargBuilder, runner(containersByAge))
    .demandCommand(1, 'You must supply a sub-command')
    .help('help')
    .alias('help', 'h')
    .argv
}

run()
