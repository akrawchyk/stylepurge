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
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const Transform = require('readable-stream').Transform
const EOL = require('os').EOL


const ts = new Transform({
  transform(chunk, encoding, next) {
    const decoder = new StringDecoder('utf8')
    const page = JSON.parse(decoder.write(chunk)) // page { url, response }

    // parse html
    const $ = cheerio.load(page.html)
    const p = url.parse(page.url)

    function resolveUrl(href) {
      let u = url.parse(href)
      if (!u.protocol && !u.host && (
          u.path.charAt(0) === '.' || (u.path.charAt(0) === '/') && (u.path.charAt(1) !== '/'))) {
        u = url.resolve(p, u.pathname)
      }
      return u
    }

    function findStyles(el) {
      const $el = $(el)
      return new Promise((resolve, reject) => {
        if ($el.is('style')) {
          console.log('style finder: STYLE')
          resolve($el.text())
        } else if ($el.is('link') && $el.attr('rel') === 'stylesheet' && $el.attr('href')) {
          const u = resolveUrl($el.attr('href'))

          if (u.host && u.host.indexOf(p.host) >= 0) {
            request.get(u.href).buffer(true).end((err, res) => {
              if (err) {
                reject(err)
              }

              console.log(`style finder: CSS ${u.href}`)
              resolve(res.text)
            })
          } else {
            console.log('style finder: NOT LOCAL')
            resolve('')
          }
        } else {
          console.log('style finder: UNRECOGNIZED')
          resolve('')
        }
      })
    }

    function findScripts(el) {
      const $el = $(el)
      return new Promise((resolve, reject) => {
        if  ($el.is('script') && ($el.attr('type') === 'text/javascript' || !$el.attr('type')) && $el.attr('src')) {
          let u = resolveUrl($el.attr('src'))

          // only grab assets local to this page
          // if path === / or ./ or ../
          // if url === page.url
          if (u.host && u.host.indexOf(p.host) >= 0) {
            request.get(u.href).buffer(true).end((err, res) => {
              if (err) {
                console.log(err)
                reject(err)
              }

              console.log(`script finder: JS ${u.href}`)
              resolve(res.text)
            })
          } else {
            console.log('script finder: NOT LOCAL')
            resolve('')
          }
        } else {
          console.log('script finder: UNRECOGNIZED')
          resolve('')
        }
      })
    }

    function gatherStyleText() {
      return new Promise((resolve, reject) => {
        const $styleTags = $('style, link')
        const styleFinders = []
        $styleTags.each((i, el) => {
          styleFinders.push(findStyles(el))
        })

        Promise.all(styleFinders).then((styleTextArray) => {
          resolve(styleTextArray.join(''))
        })
          .catch((err) => {
            console.log('style finder: error')
            reject(err)
          })
      })
    }

    function gatherScriptText() {
      return new Promise((resolve, reject) => {
        const $scriptTags = $('script')
        const scriptFinders = []
        $scriptTags.each((i, el) => {
          scriptFinders.push(findScripts(el))
        })

        Promise.all(scriptFinders).then((scriptTextArray) => {
          console.log('gathered scripts')
          resolve(scriptTextArray.join(''))
        })
          .catch((err) => {
            console.log('script finder: error')
            reject(err)
          })
      })
    }

    const styleGatherer = gatherStyleText().then((styleText) => {
      // add css property to stream object
      console.log('done gathering styles')
      page.styles = styleText
    })
    // add js property to stream object
      .catch((err) => {
        console.log('error gathering styles')
        next(err)
      })

    const scriptGatherer = gatherScriptText().then((scriptText) => {
      console.log('done gathering scripts')
      page.scripts = scriptText
    })
      .catch((err) => {
        console.log('error gathering scripts')
        next(err)
      })

    Promise.all([styleGatherer, scriptGatherer]).then(() => {
      console.log('sending updated page')
      // TODO send this page to the purify module
      // console.log(page)
      next(null, `${JSON.stringify(page)}${EOL}`)
    })
      .catch((err) => {
        next(err)
      })
  },

  flush() {
  },
})

function find() {
  return ts
}

module.exports = find
