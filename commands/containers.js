module.exports = {
  command: 'containers <bundle>',
  desc: 'list containers ordered by age',
  handler
}

function handler ({bundle}) {
  const r = require('ramda')
  const {table} = require('table')
  const {runPs} = require('../lib/dockerps')

  const getIp = settings => r.path(['Networks', 'bridge', 'IPAddress'])(settings) || ''
  const cliTruncate = require('cli-truncate')
  const truncId = str => cliTruncate(str, 13)
  const truncName = str => cliTruncate(str, 21)
  const truncImage = str => r.startsWith('sha256:', str)

  // Listing of images grouped by id.
  runPs(bundle, {
    // Extract data from nodes
    extractor: ({
      Id: id,
      Names: names,
      Image: image,
      State: state,
      Created: created,
      Mounts: mounts,
      Ports: ports,
      NetworkSettings: netSettings
    }) => ({
      id: truncId(id),
      name: names ? truncName(r.head(names)) : '',
      image: truncImage(image),
      ip: getIp(netSettings),
      state,
      ports: ports ? ports.length : 0,
      mounts: mounts ? mounts.length : 0,
      created: new Date(created * 1000).toISOString()
    }),

    // Transformation of nodes
    handler: ({nodes, nodeCount}) => {
      const selector = ({created}) => created
      const headers = ['ID', 'Name', 'Image', 'IP', 'Ports', 'Mounts', 'State', 'Created']
      const convertToRow = node => r.compose(
        r.map(key => node[key]),
        r.map(r.toLower)
      )(headers)

      const rows = r.compose(
        r.prepend(headers),
        r.map(convertToRow),
        r.sortBy(selector)
      )(nodes)

      console.log(table(rows))
      console.log(`Processed ${nodeCount} nodes.`)
    }
  })
}
