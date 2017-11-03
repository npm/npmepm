const {table} = require('table')
const {
  compose,
  equals,
  flatten,
  groupBy,
  groupWith,
  head,
  last,
  map,
  prepend,
  reduce,
  sortBy,
  split,
  toPairs,
  values
} = require('ramda')

// Containers listing sorted by age.
const containersByAge = {
  extractor: ({Id: id, Image: image, State: state, Created: created}) => ({
    id, image, state,
    created: new Date(created * 1000).toISOString()
  }),
  handler: ({nodes, nodeCount}) => {
    const selector = ({created}) => created
    const convertToRow = ({created, image, state, id}) => [id, image, state, created]
    const headers = ['ID', 'Image', 'State', 'Created']

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

module.exports = {
  containersByAge,
  imageCounts,
  imageStateCounts
}
