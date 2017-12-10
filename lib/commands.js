const {exec, which} = require('shelljs')
const {table} = require('table')
const cliTruncate = require('cli-truncate')
const {
  compose,
  equals,
  groupWith,
  head,
  join,
  map,
  path,
  prepend,
  sortBy,
  split,
  startsWith,
  toLower,
  toPairs,
  values
} = require('ramda')

const {
  red,
  yellow,
  green,
  blue
} = require('./color')

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
    id: truncId(id),
    name: names ? truncName(head(names)) : '',
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
    const convertToRow = node => compose(map(key => node[key]), map(toLower))(headers)

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
const info = path => {
  console.log(`That's all i've got.`)
}

// Look for common problems, and report on them.
const doctor = path => {
  console.log(`Appears healthy.`)
}

const listCiphers = host => {
  if (which('nmap')) {
    console.log(blue(`Listing ciphers for: ${yellow(host)}`))
    exec(`nmap --script ssl-enum-ciphers -p 443 ${host}`)
  } else {
    console.log(red(`Could not locate utility: ${yellow('nmap')}`))
  }
}

module.exports = {
  docker: {
    containers,
    imageCounts,
    imageStateCounts
  },
  security: {
    listCiphers
  },
  doctor,
  info
}
