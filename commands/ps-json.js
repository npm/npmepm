module.exports = {
  command: 'containers-json <bundle>',
  desc: 'full output of docker ps -a as JSON',
  handler
}

function handler ({bundle}) {
  const r = require('ramda')
  const buzJson = require('@buzuli/json')
  const {red, yellow, emoji} = require('@buzuli/color')
  const {WritableStreamBuffer} = require('stream-buffers')

  require('../lib/bundle')(bundle)
    .on('error', error => {
      console.error(error)
      console.error(emoji.inject(red(`Error reading bundle ${yellow(bundle)}. Details above :point_up:`)))
      process.exit(1)
    })
    .on('file', ({next, path, skip, stream}) => {
      if (r.endsWith('docker_ps_a.json')(path)) {
        const buffer = new WritableStreamBuffer()
        stream().pipe(buffer)
        stream().once('end', () => {
          console.log(buzJson(JSON.parse(buffer.getContentsAsString('utf-8'))))
          next()
        })
      } else {
        skip()
      }
    })
    .once('end', () => process.exit(0))
}
