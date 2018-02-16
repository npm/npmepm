module.exports = {
  command: 'image-state-counts <bundle>',
  desc: 'list images ordered by id and state',
  handler
}

function handler ({bundle}) {
  const r = require('ramda')
  const {table} = require('table')
  const {runPs} = require('../lib/dockerps')

  // Listing of images grouped by id.
  runPs(bundle, {
    extractor: ({Id: id, Image: image, State: state}) => ({id, image, state}),
    handler: ({nodes, nodeCount}) => {
      const selector = ({image, state}) => ([image, state])
      const grouper = (a, b) => r.equals(selector(a), selector(b))
      const convertToRow = group => {
        const {image, state} = r.head(group)
        return [image, state, group.length]
      }
      const headers = ['Image', 'State', 'Container Count']

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

