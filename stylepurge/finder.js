/**
 * Finder - finds CSS and JS in an HTML document assets and inlines them
 * Reads stream of HTML
 * Extracts styles from link hrefs
 * Replaces link tags with style tags
 * Extracts scripts from script srcs
 * Replaces script srcs with script tags
 * Writes out expanded HTML
 */

// const through = require('through2')
const cheerio = require('cheerio')
const request = require('superagent')
const StringDecoder = require('string_decoder').StringDecoder
const Transform = require('readable-stream').Transform
const ts = new Transform({
  read() {
  },

  write(chunk, encoding, next) {
    const decoder = new StringDecoder('utf8')
    const page = JSON.parse(decoder.write(chunk)) // page { url, response }

    // parse html
    const $ = cheerio.load(page.response)

    // // array of all style text
    // const styles = []

    // FIXME need to return individual text, not a single one
    const gatherStyleText = new Promise((resolve, reject) => {
      $('style, link').each((i, el) => {
        const $el = $(el)
        if ($el.is('style')) {
          console.log('STYLE')
          resolve($el.text())
        } else if ($el.is('link') && $el.attr('rel') === 'stylesheet' && $el.attr('href')) {
          const href = $el.attr('href')
          request.get(href)
            .end((err, res) => {
              if (err) {
                reject(err.message)
              }

              console.log('CSS')
              resolve(res.text)
            })
        } else {
          resolve('') // avoid errors
        }
      })
    })

    gatherStyleText.then((styles) => {
      console.log(styles)
    })
    .catch((err) => {
      console.log(err)
    })

    // FIXME could wrap this all in one promise?
    // const styleText = $('style').map((i, el) => $(el).text()).get()
    // styles.push(styleText)

    // extract hrefs
    // const styleHrefs = $('link').filter((i, el) => {
    //   const $el = $(el)
    //   return $el.attr('rel') === 'stylesheet' && $el.attr('href')
    // }).map((i, el) => {
    //   // download css
    //   const $el = $(el)
    //   const href = $el.attr('href')
    //   return new Promise((resolve, reject) => {
    //     request.get(href)
    //       .end((err, res) => {
    //         if (err) {
    //           reject(err.message)
    //         }
    //
    //         styles.push(res.text)
    //         resolve(res)
    //       })
    //   })
    // }).get()
    //
    // Promise.all(styleHrefs).then(() => {
    //   // FIXME need to wait until responses are finished piping to styles
    //   console.log(styles)
    // })
    // .catch((err) => {
    //   console.log(err.message)
    // })

    // TODO gather scripts
    // const scriptHrefs = $('script').filter((i, el) => {
    //   return $(el).attr('src')
    // })

    // const scripts = $('script').filter((i, el) => {
    //   const $el = $(el)
    //   return !$el.attr('src') &&
    //     ($el.attr('type') === 'text/javascript' || !$el.attr('type'))
    // })

    // console.log('style hrefs: ', styleHrefs)
    // console.log('styles: ', styles)
    // console.log('script hrefs: ', scriptHrefs)
    // console.log('scripts: ', scripts)

    // request hrefs

    // write requested assets into tags

    // push new html on read stream

    next()
  },

  _flush() {
  },
})

function find() {
  return ts
}

module.exports = find
