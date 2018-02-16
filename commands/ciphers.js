module.exports = {
  command: 'ciphers <host>',
  desc: 'list TLS ciphers for host',
  handler
}

function handler ({host}) {
  const {blue, red, yellow} = require('@buzuli/color')
  const {exec, which} = require('shelljs')

  if (which('nmap')) {
    console.log(blue(`Listing ciphers for: ${yellow(host)}`))
    exec(`nmap --script ssl-enum-ciphers -p 443 ${host}`)
  } else {
    console.log(red(`Could not locate utility: ${yellow('nmap')}`))
  }
}
