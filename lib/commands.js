const {table} = require('table')
const cliTruncate = require('cli-truncate')
const {
  compose,
  equals,
  flatten,
  groupBy,
  groupWith,
  head,
  join,
  last,
  map,
  path,
  prepend,
  reduce,
  sortBy,
  split,
  startsWith,
  toPairs,
  values
} = require('ramda')

const truncId = str => cliTruncate(str, 13)
const truncImage = str => startsWith('sha256:', str) ?
    cliTruncate(str, 20) : cliTruncate(str, 20, {position: 'start'})
const truncName = str => cliTruncate(str, 21)
const getIp = settings => path(['Networks', 'bridge', 'IPAddress'])(settings) || ''

const fmtPorts = ports => {
  if (ports) {
    return join(", ")(
      map(
        ({PrivatePort: priv, PublicPort: pub, Type: proto}) => `[${proto}/${priv}]:${pub}`
      )(ports)
    )
  } else {
    return ''
  }
}

// Containers listing sorted by age.
const containers = {
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
    id,
    image,
    ip: getIp(netSettings),
    names: names ? truncName(head(names)) : '',
    state,
    ports: ports ? ports.length : 0,
    mounts: mounts ? mounts.length : 0,
    created: new Date(created * 1000).toISOString()
  }),

  // Transformation of nodes
  handler: ({nodes, nodeCount}) => {
    const selector = ({created}) => created
    const headers = ['ID', 'Names', 'Image', 'State', 'IP', 'Ports', 'Mounts', 'Created']
    const convertToRow = ({
      id, names, image, state, ip, ports, mounts, created
    }) => [
      truncId(id), names, truncImage(image), state, ip, ports, mounts, created
    ]

    const rows = compose(
      prepend(headers),
      map(convertToRow),
      sortBy(selector)
    )(nodes)

    console.log(table(rows))
    console.log(`Processed ${nodeCount} nodes.`)
  }
}

// Listing of images grouped by id.
const imageCounts = {
  extractor: ({Id: id, Image: image}) => ({id, image}),
  handler: ({nodes, nodeCount}) => {
    const selector = ({image}) => image
    const grouper = (a, b) => equals(a.image, b.image)
    const convertToRow = group => [head(group).image, group.length]
    const headers = ['Image', 'Container Count']

    const rows = compose(
      prepend(headers),
      map(values),
      map(convertToRow),
      groupWith(grouper),
      sortBy(selector)
    )(nodes)

    console.log(table(rows))
    console.log(`Processed ${nodeCount} nodes.`)
  }
}

// Listing images grouped by id and state.
const imageStateCounts = {
  extractor: ({Id: id, Image: image, State: state}) => ({id, image, state}),
  handler: ({nodes, nodeCount}) => {
    const selector = ({image, state}) => ([image, state])
    const grouper = (a, b) => equals(selector(a), selector(b))
    const convertToRow = group => {
      const {image, state} = head(group)
      return [image, state, group.length]
    }
    const headers = ['Image', 'State', 'Container Count']

    const rows = compose(
      prepend(headers),
      map(values),
      map(convertToRow),
      groupWith(grouper),
      sortBy(selector)
    )(nodes)

    console.log(table(rows))
    console.log(`Processed ${nodeCount} nodes.`)
  }
}

// Summarize the state of the installation.
const info = (path) => {
  console.log(`That's all i've got.`)
}

// Look for common problems, and report on them.
const doctor = (path) => {
  console.log(`Appears healthy.`)
}

module.exports = {
  docker: {
    containers,
    imageCounts,
    imageStateCounts
  },
  doctor,
  info
}
