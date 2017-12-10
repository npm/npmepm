const fs = require('fs')
const gunzip = require('gunzip-maybe')
const tar = require('tar-stream')
const walk = require('walk')
const EventEmitter = require('events')

const tarSource = (events, path, options) => {
  // TODO: confirm that the source is a tar file
  
  const unzip = gunzip()
  const untar = tar.extract()
  fs.createReadStream(path).pipe(unzip).pipe(untar)

  untar.on('entry', (header, fileStream, next) => {
    //console.log(`[tar:entry]`, header.name)
    const path = header.name
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

  untar.on('finish', () => {
    //console.log(`[tar:finish]`)

    setImmediate(() => events.emit('end'))
  })
}

const dirSource = (events, path, options) => {
  // TODO: confirm that source is a directory
  
  walker = walk.walk(path, options)

  walker.on('errors', (root, nodeStatsArray, next) => {
    //console.error(`[dir:errors]`, root)
    setImmediate(() => events.emit('error', {root, nodeStatsArray}))
  })

  walker.on('file', (root, fileStats, next) => {
    //console.log(`[dir:entry]`, root, fileStats)
    const path = `${root}/${fileStats.name}`

    if (fileStats.type === 'file') {
      //console.log(`[dir:file]`, path)
      const skip = next
      const stream = () => {
        const stream = fs.createReadStream(path)
        stream.pause()
        return stream
      }
      setImmediate(() => events.emit('file', {next, path, skip, stream}))
    } else {
      //console.warn(`[dir:${fileSats.type}] Ignoring path ${path}`)
      setImmediate(next)
    }
  })

  walker.on('end', () => {
    //console.log(`[dir:end]`, root)

    setImmediate(() => events.emit('end'))
  })
}

const bundle = (path, options) => {
  // TODO: determine mode based on path properties
  const events = new EventEmitter()

  fs.stat(path, (err, stats) => {
    if (err) {
      const events = new EventEmitter()
      //console.error(`Error pulling stats on file:`, err)
      process.nextTick(() => events.emit('error', err))
    } else {
      console.log('path:', path)
      return (stats.isDirectory() ? dirSource : tarSource)(events, path, options)
    }
  })

  return events
}

module.exports = bundle
