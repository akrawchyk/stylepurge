'use strict'


const purifycss = require('purify-css')
const EOL = require('os').EOL
const StringDecoder = require('string_decoder').StringDecoder
const Transform = require('readable-stream').Transform


function purify() {
  return new Transform({
    transform(chunk, encoding, next) {
      const decoder = new StringDecoder('utf8')
      const page = JSON.parse(decoder.write(chunk)) // page { url, response }

      // { url, html, styles, scripts }
      try {
        purifycss(`${page.html} ${page.scripts}`, page.styles, (purified) => {
          next(null, `${JSON.stringify({ url: page.url, purified: purified, original: page.styles })}${EOL}`)
        })
      } catch (e) {
        next(e)
      }
    },

    flush() {

    }
  })
}

module.exports = purify
