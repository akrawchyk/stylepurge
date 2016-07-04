/**
 * Entry point for stylepurge. Accepts an array of urls to download their HTML.
 * Then, finds all style and script assets in the document, and downloads them
 * if necessary. These are fed into purify-css which returns the page's CSS sans
 * any unused styles.
 *
 * Each url is parsed into an object representing a page. It starts as
 *
 *     { url: 'https://ex.com' }
 *
 * and each transform changes the object. So first phantomjs renders the document
 * and saves the HTML content. After crawler
 *
 *     { url: 'https://ex.com', html: '<DOCTYPE...' }
 *
 * after finder
 *
 *     { url: 'https://ex.com', html: '<DOCTYPE...', styles: '.class{}...', scripts: 'var asdf...' }
 *
 * and finally, after purifier
 *
 *     { url: 'https://ex.com', purified: '.class{}...', original: '.class{}...'
 *
 * All components communicate via streams, and use Newline Delimited JSON as the
 * format for passing messages, see http://ndjson.org/
 */

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
