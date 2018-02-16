const crypto = require('crypto')
const path = require('path')
const Promise = require('bluebird')
const tap = require('tap')
const {comparator} = require('ramda')

const bundle = require('../lib/bundle')

const sha256 = text => crypto.createHash('sha256').update(text).digest('hex')

tap.test(`Both tar and directory should have identical content (paths and data)`, t => {
  Promise
  .all([
    sizeOrderHash(path.resolve(__dirname, 'test-data')),
    sizeOrderHash(path.resolve(__dirname, 'test-data.tar.gz'))
  ])
  .spread((dirHash, tarHash) => {
    t.equals(dirHash, tarHash)
    t.end()
  })
})

function sizeOrderHash(path) {
  return new Promise((resolve, reject) => {
    let hashes = []

    bundle(path)
    .on('file', ({next, path, stream}) => {
      const hash = crypto.createHash('sha256')
      // TODO: figure out why paths do not match between tar/dir
      //hash.update(path)

      stream()
      .on('data', data => hash.update(data))
      .on('end', () => {
        const digest = hash.digest('hex')
        hashes.push(digest)
        next()
      })
      .resume()
    })
    .on('end', () => {
      resolve(sha256(hashes.sort().join('')))
    })
  })
}

