/**
 * Crawler
 * PhantomJS writes to stream with content of crawled pages
 * Streams HTML from phantomjs after document load
 */

'use strict'

const phantom = require('phantom')
const Readable = require('readable-stream').Readable
const EOL = require('os').EOL
const rs = new Readable({
  read() {
  },
})

function worker(url) {
  let phInstance
  let sitepage

  return phantom.create(['--ignore-ssl-errors=yes'/*, '--load-images=no'*/])
    .then((instance) => {
      instance.process.stderr.pipe(process.stderr)
      phInstance = instance
      return instance.createPage()
    })
    .then((page) => {
      sitepage = page
      return page.open(url)
    })
    .then((status) => {
      // TODO handle unsuccessful
      return sitepage.property('content')
    })
    .then((content) => {
      sitepage.close()
      phInstance.exit()
      rs.push(`${JSON.stringify({ url, response: content })}${EOL}`)
    })
    .catch((err) => {
      process.stderr.write(err.message)
      phInstance.exit()
    })
}

function spawn(urls) {
  // TODO queue up spawns for worker pool w/max worker count
  if (urls.length > 0) {
    worker(urls[0])
      .then(() => {
        spawn(urls.slice(1))
      })
  }
}

function run(urls = [], options = {}) {
  const u = Array.isArray(urls) ? urls : [urls]
  spawn(u)
  return rs
}


module.exports = run
