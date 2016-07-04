'use strict'

const crawler = require('./crawler')
const finder = require('./finder')
const purifier = require('./purifier')


module.exports = function(urls) {
  if (!Array.isArray(urls)) {
    urls = [urls]
  }

  return crawler(urls)
    .pipe(finder())
    .pipe(purifier())
    .on('error', (err) => {
      process.stderr.write(err.message)
    })
}
