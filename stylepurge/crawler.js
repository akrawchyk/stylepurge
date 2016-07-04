/**
 * Crawler
 * PhantomJS writes to stream with content of a crawled page
 * Streams HTML from phantomjs after document load
 */

'use strict'

const Promise = require('bluebird')
const phantom = require('phantom')
const Readable = require('readable-stream').Readable
const EOL = require('os').EOL


function run(urls = [], options = {}) {
  const rs = new Readable({
    read() {
    },
  })
  const u = Array.isArray(urls) ? urls : [urls]
  const pool = []
  let urlCount = 0

  function worker(url) {
    let phInstance
    let sitepage

    return new Promise((resolve, reject) => {
      phantom.create(['--ignore-ssl-errors=yes'/*, '--load-images=no'*/])
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
          rs.push(`${JSON.stringify({ url, html: content })}${EOL}`)
          resolve()
        })
        .catch((err) => {
          process.stderr.write(err.message)
          phInstance.exit()
          rs.emit('error', err)
          reject(err)
        })
    })
  }

  function spawn(urls = []) {
    // TODO queue up spawns for worker pool w/max worker count
    if (urls.length > 0) {
      const w = worker(urls[0])
        .finally(() => {
          const u = urls.slice(1)
          if (u.length) {
            spawn(u)
          } else {
            Promise.all(pool).finally(() => {
              rs.push(null)
              rs.emit('end')
            })
          }
        })
      pool.push(w)
    }
  }

  spawn(u)

  return rs
}


module.exports = run
