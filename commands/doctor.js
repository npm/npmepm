module.exports = {
  command: 'doctor <bundle>',
  desc: 'report on common problems',
  handler
}

function handler({bundle}) {
  const {emoji} = require('@buzuli/color')
  const health = tracker()

  require('../lib/bundle')(bundle)
  .on('error', error => {
    console.error(error)
    console.error(emoji.inject(red(`Error reading bundle ${yellow(bundle)}. Details above :point_up:`)))
  })
  .on('file', health.checker)
  .once('end', () => {
    if (health.issues.length > 0) {
      console.log(emoji.inject(`:x: There are ${health.issues.length} health issues with this cluster.`))
    } else {
      console.log(emoji.inject(`:white_check_mark:  Appears healthy.`))
    }
  })
}

function checkFile ({next, path, skip, stream, issues}) { 
  skip()
}

function tracker () {
  const issues = []

  return {
    issues: () => issue,
    checker: file => {
      console.log(path)
      checkFile({issues, ...file})
    }
  }
}
