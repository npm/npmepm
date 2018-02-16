module.exports = {
  command: 'image-counts <bundle>',
  desc: 'list images ordered by id',
  handler
}

function handler ({bundle}) {
  const cliTruncate = require('cli-truncate')
  const r = require('ramda')
  const {table} = require('table')
  const {runPs} = require('../lib/dockerps')

  const getIp = settings => r.path(['Networks', 'bridge', 'IPAddress'])(settings) || ''
  const truncId = str => cliTruncate(str, 13)
  const truncName = str => cliTruncate(str, 21)
  const truncImage = str => r.startsWith('sha256:', str)
    ? cliTruncate(str, 20)
    : cliTruncate(str, 20, {position: 'start'})
  const fmtPorts = ports => {
    if (ports) {
      return r.join(", ")(
        r.map(
          ({PrivatePort: priv, PublicPort: pub, Type: proto}) => `[${proto}/${priv}]:${pub}`
        )(ports)
      )
    } else {
      return ''
    }
  }

  // Listing of images grouped by id.
  runPs(bundle, {
    extractor: ({Id: id, Image: image}) => ({id, image}),
    handler: ({nodes, nodeCount}) => {
      const selector = ({image}) => image
      const grouper = (a, b) => r.equals(a.image, b.image)
      const convertToRow = group => [r.head(group).image, group.length]
      const headers = ['Image', 'Container Count']

      const rows = r.compose(
        r.prepend(headers),
        r.map(r.values),
        r.map(convertToRow),
        r.groupWith(grouper),
        r.sortBy(selector)
      )(nodes)

      console.log(table(rows))
      console.log(`Processed ${nodeCount} nodes.`)
    }
  })
}

