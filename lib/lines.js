module.exports = {
  extractLine,
  extractLines
}

const LBL = require('line-by-line')

function extractLine (filter) {
  return (stream) => {
    return new Promise((resolve, reject) => {
      const lines = new LBL(stream)
      let savedLine

      function lineListener (line) {
        if (filter(line)) {
          savedLine = line
          lines.removeListener('line', lineListener)
        }
      }

      lines.on('line', lineListener)
      lines.on('error', error => reject(error))
      lines.on('end', () => resolve(savedLine))
    })
  }
}

function extractLines (filter) {
  return (stream) => {
    return new Promise((resolve, reject) => {
      const lines = new LBL(stream)
      let savedLines = []

      function lineListener (line) {
        if (filter(line)) {
          savedLines.push(line)
        }
      }

      lines.on('line', lineListener)
      lines.on('error', error => reject(error))
      lines.on('end', () => resolve(savedLines))
    })
  }
}
