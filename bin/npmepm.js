const {runPs} = require('../lib/dockerps')
const {
  docker: {
    containers,
    doctor,
    imageCounts,
  },
  security: {
    listCiphers: ciphers
  },
  imageStateCounts,
  info
} = require('../lib/commands')

function run () {
  const yargBundle = (yargs) => yargs.positional('<bundle-dir>', {type: 'string'})
  const yargHost = (yargs) => yargs.positional('<host>', {type: 'string'})

  const psRunner = (options) => ({bundleDir}) => runPs(bundleDir, options)
  const actRunner = (action) => ({bundlerDir}) => action(bundlerDir)
  const hostRunner = (action) => ({host}) => action(host)

  return require('yargs')
    .command('image-counts <bundle-dir>', 'List images grouped by id', yargBundle, psRunner(imageCounts))
    .command('image-state-counts <bundle-dir>', 'List images grouped by id and state', yargBundle, psRunner(imageStateCounts))
    .command('containers <bundle-dir>', 'List containers (ordered by age)', yargBundle, psRunner(containers))
    .command('doctor <bundler-dir>', 'Report on common problems', yargBundle, actRunner(doctor))
    .command('info <bundler-dir>', 'Summarize bundle info', yargBundle, actRunner(info))
    .command('ciphers <host>', 'List TLS ciphers for hsot', yargHost, hostRunner(ciphers))
    .demandCommand(1, 'You must supply a sub-command')
    .help('help')
    .alias('help', 'h')
    .argv
}

run()
