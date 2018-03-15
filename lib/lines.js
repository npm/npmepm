module.exports = {
  extractLine,
  extractLines
}

const byline = require('byline')

function extractLine (filter) {
  return (stream) => {
    return new Promise((resolve, reject) => {
      const lines = byline.createStream(stream)
      let savedLine

      function lineListener (l) {
        const line = l.toString()
        if (filter(line)) {
          savedLine = line
          lines.removeListener('data', lineListener)
        }
      }

      lines.on('data', lineListener)
      lines.on('error', error => reject(error))
      lines.on('end', () => resolve(savedLine))
    })
  }
}

function extractLines (filter) {
  return (stream) => {
    return new Promise((resolve, reject) => {
      const lines = byline.createStream(stream)
      let savedLines = []

      function lineListener (l) {
        const line = l.toString()
        if (filter(line)) {
          savedLines.push(line)
        }
      }

      lines.on('data', lineListener)
      lines.on('error', error => reject(error))
      lines.on('end', () => resolve(savedLines))
    })
  }
}
