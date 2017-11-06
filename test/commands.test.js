const tap = require('tap')

const {
  containersByAge,
  imageCounts,
  imageStateCounts
} = require('../lib/commands')

tap.test('containers by age', t => {
  return t.test('extractor', t => {
    const {extractor} = containersByAge
    const source = {Id: 'a', Image: 'b', State: 'Running', Created: 0, Extra: 'read all about it'}
    const expected = {id: 'a', image: 'b', state: 'Running', created: '1970-01-01T00:00:00.000Z'}
    const actual = extractor(source)

    tap.same(actual, expected, "Extract correct values when all are present")

    t.done()
  })
  .then(() => t.test('handler', t => {
    const {handler} = containersByAge

    const source = [
      { Id: '1', Image: 'a', State: 'Stopped', Created: 1 },
      { Id: '2', Image: 'a', State: 'Running', Created: 3 },
      { Id: '3', Image: 'b', State: 'Running', Created: 2 },
      { Id: '4', Image: 'b', State: 'Running', Created: 4 }
    ]

    const expected = {nodeCount: 4, rowCount: 4}
    const actual = handler({nodes: source, nodeCount: source.length})

    t.same(actual, expected, "All containers should be represented in the output")

    t.done()
  }))
})

tap.test('image counts', t => {
  return t.test('extractor', t => {
    const {extractor} = imageCounts
    const source = {Id: 'a', Image: 'b', Extra: 'read all about it'}
    const expected = {id: 'a', image: 'b'}
    const actual = extractor(source)

    tap.same(actual, expected, "Extract correct values when all are present")

    t.done()
  })
})

tap.test('image state counts', t => {
  return t.test('extractor', t => {
    const {extractor} = imageStateCounts
    const source = {Id: 'a', Image: 'b', State: 'Running', Extra: 'read all about it'}
    const expected = {id: 'a', image: 'b', state: 'Running'}
    const actual = extractor(source)

    tap.same(actual, expected, "Extract correct values when all are present")

    t.done()
  })
})
