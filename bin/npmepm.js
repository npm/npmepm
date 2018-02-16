#!/usr/bin/env node

return require('yargs')
  .commandDir('../commands')
  .demandCommand()
  .help('help')
  .alias('help', 'h')
  .argv
