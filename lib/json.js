module.exports = {
  parseStream
}

const {WritableStreamBuffer} = require('stream-buffers')

function parseStream (stream) {
  return new Promise((resolve, reject) => {
    const buffer = new WritableStreamBuffer()
    stream.pipe(buffer)
    stream.once('error', error => reject(error))
    stream.once('end', () => resolve(JSON.parse(buffer.getContentsAsString('utf-8'))))
  })
}
