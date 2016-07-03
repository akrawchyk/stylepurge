'use strict'


const purifycss = require('purify-css')
const StringDecoder = require('string_decoder').StringDecoder
const Transform = require('readable-stream').Transform


const ts = new Transform({
  transform(chunk, encoding, next) {
    const decoder = new StringDecoder('utf8')
    const page = JSON.parse(decoder.write(chunk)) // page { url, response }

    // write page to temp files

    // { url, html, styles, scripts }
    console.log('purifying')
    purifycss(`${page.html} ${page.scripts}`, page.styles, (purified) => {
      next(null, purified)
    })
  },

  flush() {

  }
})


function purify() {
  return ts
}

module.exports = purify
