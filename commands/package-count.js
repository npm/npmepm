module.exports = {
  command: 'package-count <registry-url>',
  desc: 'check package counts on a registry',
  handler
}

function handler ({registryUrl}) {
  const r = require('ramda')
  const axios = require('axios')
  const {blue, grey, orange, red, emoji} = require('@buzuli/color')

  axios
    .get(registryUrl, {
      validateStatus: _s => true
    })
    .then(({status, data = {}}) => {
      if (status === 200) {
        const {doc_count: docCount} = data
        if (r.isNil(docCount)) {
          console.error(red(`URL does not appear to be a valid registry (bad response format) : ${grey(JSON.stringify(data))}`))
          process.exit(1)
        } else {
          console.info(`Package count: ~ ${orange(docCount)}`)
        }
      } else {
        console.error(`[${red(status)}] ${grey(JSON.stringify(data))}`)
        process.exit(1)
      }
    })
    .catch(error => {
      console.error(error)
      console.error(
        red(`Error fetching package count for ${blue(registryUrl)}`) +
      emoji.inject(` ... details above :point_up:`)
      )
      process.exit(1)
    })
}
