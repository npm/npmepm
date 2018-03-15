#!/usr/bin/env node

run()

function run () {
  return require('yargs')
    .commandDir('../commands')
    .demandCommand()
    .help('help')
    .alias('help', 'h')
    .argv
}
