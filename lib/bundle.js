const EventEmitter = require('events')
const fs = require('fs')
const gunzip = require('gunzip-maybe')
const {join: joinPath} = require('path')
const tar = require('tar-stream')
const walk = require('walk')

// Walk support bundle archive
const tarSource = (events, path, options) => {
  const unzip = gunzip()
  const untar = tar.extract()

  fs.createReadStream(path).pipe(unzip).pipe(untar)

  untar.on('entry', (header, fileStream, next) => {
    const path = joinPath(header.name)
    const stream = () => fileStream
    const skip = () => {
      fileStream.on('end', next)
      fileStream.resume()
    }

    if (header.type === 'file')
      setImmediate(() => events.emit(header.type, {next, path, skip, stream}))
    else
      skip()
  })

  untar.on('error', error => setImmediate(() => events.emit('error', error)))
  untar.on('finish', () => setImmediate(() => events.emit('end')))
}

// Walk extracted support bundle directory
const dirSource = (events, path, options) => {
  const walker = walk.walk(path, options)

  walker.on('errors', (root, nodeStatsArray, next) => {
    setImmediate(() => events.emit('error', {root, nodeStatsArray}))
  })

  walker.on('file', (root, fileStats, next) => {
    const path = joinPath(`${root}/${fileStats.name}`)

    if (fileStats.type === 'file') {
      const skip = next
      const stream = () => {
        const stream = fs.createReadStream(path)
        stream.pause()
        return stream
      }
      setImmediate(() => events.emit('file', {next, path, skip, stream}))
    } else {
      setImmediate(next)
    }
  })

  walker.on('end', () => setImmediate(() => events.emit('end')))
}

// Determine how to walk the support bundle (tar or directory)
const bundle = (path, options) => {
  const events = new EventEmitter()

  fs.stat(path, (err, stats) => {
    if (err) {
      const events = new EventEmitter()
      process.nextTick(() => events.emit('error', err))
    } else {
      return (stats.isDirectory() ? dirSource : tarSource)(events, path, options)
    }
  })

  return events
}

module.exports = bundle
