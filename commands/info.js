module.exports = {
  command: 'info <bundle>',
  desc: 'summarize bundle info',
  handler
}

function handler({bundle}) {
  console.log(`That's all i've got.`)
}
