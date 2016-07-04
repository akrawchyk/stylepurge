/**
 * Finder - finds CSS and JS in an HTML document assets and extracts them
 * Reads HTML document
 * Finds styles in style tags and link hrefs
 * Downloads CSS if necessary
 * Finds scripts in script tags
 * Downloads JS if necessary
 */

const cheerio = require('cheerio')
const oust = require('oust')
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
      const p = url.parse(page.url)
      // this makes matching CDN names easier for assets on this domain, won't
      // work well for linked external assets though
      const ownHostname = /^(\w+)\.\w+$/.exec(p.hostname)[1] // get hostname without the .xyz

      // checks if this asset is owned by the page
      function isOwnAsset(assetUrl) {
        const u = url.parse(assetUrl)
        let own = false

        // absolute url
        if (u.host && u.hostname.indexOf(ownHostname) >= 0) {
          own = true
        }

        // relative url
        if (!u.protocol && !u.host && (
          u.path.charAt(0) === '.' || (u.path.charAt(0) === '/') && (u.path.charAt(1) !== '/'))) {
          own = true
        }

        return own
      }

      // resolves a relative url to its absolute url on this page's domain
      function resolveUrl(href) {
        let u = url.parse(href)
        // if url === page.url and path === / or ./ or ../
        if (!u.protocol && !u.host && (
          u.path.charAt(0) === '.' || (u.path.charAt(0) === '/') && (u.path.charAt(1) !== '/'))) {
            u = url.resolve(p, u.pathname)
          }

        return u
      }

      // downloads asset, rejects if failed
      function fetchAsset(u) {
        return new Promise((resolve, reject) => {
          request.get(u.href).buffer(true).end((err, res) => {
            if (err) {
              reject(err)
            }

            resolve(res.text)
          })
        })
      }

      // gather asset urls
      const cssUrls = oust(page.html, 'stylesheets')
        .concat(oust(page.html, 'preload'))
        .filter(isOwnAsset)
      const cssDownloads = cssUrls
        .map(resolveUrl)
        .map(fetchAsset)

      const jsUrls = oust(page.html, 'scripts')
        .filter(isOwnAsset)
      const jsDownloads = jsUrls
        .map(resolveUrl)
        .map(fetchAsset)

      // TODO imports

      const assetDownloads = cssDownloads.concat(jsDownloads)

      Promise.all(assetDownloads).then((assetsText) => {
        const stylesText = assetsText.slice(0, cssUrls.length)
        const scriptsText = assetsText.slice(cssUrls.length)

        // extract all relevant asset text
        const $ = cheerio.load(page.html)

        $('style').each((i, el) => {
          stylesText.push($(el).text())
        })

        $('script').each((i, el) => {
          const $el = $(el)
          if (!$el.attr('src') && ($el.attr('type') === 'text/javascript' || !$el.attr('type'))) {
            scriptsText.push($el.text())
          }
        })

        page.styles = stylesText.join('')
        page.scripts = scriptsText.join('')

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
