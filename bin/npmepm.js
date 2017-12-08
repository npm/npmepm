const {runPs} = require('../lib/dockerps')
const {
  docker: {
    containers,
    doctor,
    imageCounts,
  },
  imageStateCounts,
  info
} = require('../lib/commands')

function run () {
  const yargBuilder = (yargs) => yargs.positional('<bundle-dir>', {type: 'string'})
  const psRunner = (options) => ({bundleDir}) => runPs(bundleDir, options)
  const actRunner = (action) => ({bundlerDir}) => action(bundlerDir)

  return require('yargs')
    .command('image-counts <bundle-dir>', 'List images grouped by id', yargBuilder, psRunner(imageCounts))
    .command('image-state-counts <bundle-dir>', 'List images grouped by id and state', yargBuilder, psRunner(imageStateCounts))
    .command('containers <bundle-dir>', 'List containers (ordered by age)', yargBuilder, psRunner(containers))
    .command('doctor <bundler-dir>', 'Report on common problems', yargBuilder, actRunner(doctor))
    .command('info <bundler-dir>', 'Summarize bundle info', yargBuilder, actRunner(info))
    .demandCommand(1, 'You must supply a sub-command')
    .help('help')
    .alias('help', 'h')
    .argv
}

run()
