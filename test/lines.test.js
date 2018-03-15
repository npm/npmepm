const tap = require('tap')
const r = require('ramda')
const {
  ReadableStreamBuffer
} = require('stream-buffers')

const {
  extractLine,
  extractLines
} = require('../lib/lines')

const extract = (text, filter, extractor) => {
  const input = new ReadableStreamBuffer()
  input.put(Buffer.from(text))
  input.stop()
  return extractor(filter)(input)
}

const line = async (text, filter) => extract(text, filter, extractLine)
const lines = async (text, filter) => extract(text, filter, extractLines)
const json = v => JSON.stringify(v)

tap.test('extractLine', async t => {
  t.equal(await line(
    `
    skip
    `, l => false
  ), undefined, 'line match a line')

  t.equal(await line(
    ``, l => r.endsWith('.')
  ), undefined, 'should process an empty string')

  t.equal(await line(
    ``, l => true
  ), undefined, 'no matches for empty streams')

  t.equal(await line(
    ` `, l => true
  ), ' ', 'should support matches on a single line')

  t.equal(r.trim(await line(
    `
    
    `, l => true
  )), '', 'should support processing of empty lines')

  t.equal(r.trim(await line(
    `locate`, l => r.endsWith('locate')(l)
  )), 'locate', 'should match the only line')

  t.equal(r.trim(await line(
    `
    lint
    locate
    lurch
    `, l => r.endsWith('locate')(l)
  )), 'locate', 'should match the correct line')

  t.equal(r.trim(await line(
    `
    locate
    locale
    `, l => r.startsWith('loca')(r.trim(l))
  )), 'locate', 'should match the first line')
})

tap.test('extractLines', async t => {
  t.equal(json(await lines(
    `
    skip
    both
    `, l => false
  )), json([]), 'should not match any lines')

  t.equal(json(r.map(r.trim)(await lines(
    `
    first
    second
    `, l => r.endsWith('second')(l)
  ))), json(['second']), 'should match the correct line')

  t.equal(json(r.map(r.trim)(await lines(
    `
    first

    second

    third
    `, l => r.trim(l) !== ''
  ))), json(['first', 'second', 'third']), 'should match the correct lines')
})
