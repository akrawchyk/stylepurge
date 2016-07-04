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


function find() {
  return new Transform({
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
            resolve($el.text())
          } else if ($el.is('link') && $el.attr('rel') === 'stylesheet' && $el.attr('href')) {
            const u = resolveUrl($el.attr('href'))

            if (u.host && u.host.indexOf(p.host) >= 0) {
              request.get(u.href).buffer(true).end((err, res) => {
                if (err) {
                  reject(err)
                }

                resolve(res.text)
              })
            } else {
              resolve('')
            }
          } else {
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
                  reject(err)
                }

                resolve(res.text)
              })
            } else {
              resolve('')
            }
          } else {
            resolve('')
          }
        })
      }

      // TODO refactor to a gatherer object, don't need 2 functions
      function gatherStyleText() {
        return new Promise((resolve, reject) => {
          const $styleTags = $('style, link')
          const styleFinders = []
          $styleTags.each((i, el) => {
            // TODO refactor this to only pass through to be downloaded assets
            styleFinders.push(findStyles(el))
          })

          Promise.all(styleFinders).then((styleTextArray) => {
            resolve(styleTextArray.join(''))
          })
            .catch((err) => {
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
            resolve(scriptTextArray.join(''))
          })
            .catch((err) => {
              reject(err)
            })
        })
      }

      const styleGatherer = gatherStyleText().then((styleText) => {
        // add css property to stream object
        page.styles = styleText
      })
        .catch((err) => {
          next(err)
        })

      const scriptGatherer = gatherScriptText().then((scriptText) => {
        // add scripts property to stream object
        page.scripts = scriptText
      })
        .catch((err) => {
          next(err)
        })

      Promise.all([styleGatherer, scriptGatherer]).then(() => {
        next(null, `${JSON.stringify(page)}${EOL}`)
      })
        .catch((err) => {
          next(err)
        })
    },

    flush() {
    },
  })
}

module.exports = find
