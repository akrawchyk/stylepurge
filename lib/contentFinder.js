/**
 * Finds and extracts the <body> outerHTML, JS and CSS from an HTML document.
 * Removes JS and CSS from the page.
 */
'use strict'

const DomUtils = require('domutils')
const htmlparser = require('htmlparser2')
const temp = require('temp')
const http = require('http')
const https = require('https')
const url = require('url')

// temp.track()

// write files for assets
const styleWriter = temp.createWriteStream({ suffix: '.css' })
const scriptWriter = temp.createWriteStream({ suffix: '.js' })
const bodyWriter = temp.createWriteStream({ suffix: '.html' })

function parseDom (html) {
  return new Promise((resolve, reject) => {
    const handler = new htmlparser.DomHandler((error, dom) => {
      if (error) {
        reject(error)
      } else {
        resolve(dom)
      }
    })

    const parser = new htmlparser.Parser(handler)
    parser.write(html)
    parser.end()
  })
}

function downloadAndWrite (u, host, writer) {
  return new Promise((resolve, reject) => {
    const iface = u.protocol === 'https:' ? https : http

    if (!u.host) {
      u.host = host
    }

    if (!u.protocol) {
      u.protocol = 'http:'
    }

    iface.get(url.format(u), (res) => {
      res.on('error', (err) => {
        console.log(`res Error ${url.format(u)}`, err.message)
        resolve()  // ignore errors
      })

      res.on('data', (chunk) => {
        writer.write(chunk)
      })
    }).on('error', (err) => {
      console.log(`iface Error ${url.format(u)}`, err.message)
      resolve()  // ignore errors
    })
  })
}

function getCSS (dom, pageHost) {
  return new Promise((resolve, reject) => {
    const css = DomUtils.find((el) => {
      // <link rel="stylesheet" href="...">
      if (el.name === 'link') {
        const attribs = el.attribs

        if (attribs.rel === 'stylesheet' && attribs.href) {
          return true
        }
      }
    }, dom, true, 32)

    if (css.length === 0) {
      resolve()  // nothing to do
    }

    css.forEach((el, i) => {
      const cssUrl = url.parse(el.attribs.href, false, true)

        console.log('css ', i)

      downloadAndWrite(cssUrl, pageHost, styleWriter).then(() => {
        if (i === css.length - 1) {
          resolve()
        }
      })
        .catch((err) => {
          console.log(`Error ${url.format(cssUrl)}`, err.message)
          resolve()  // ignore errors
        })
    })
  })
}

function getStyles (dom) {
  return new Promise((resolve, reject) => {
    const styles = DomUtils.find((el) => {
      // <style>
      return el.name === 'style'
    }, dom, true, 32)

    styleWriter.on('error', (err) => {
      reject(err)
    })

    styles.forEach((el, i) => {
      const text = DomUtils.getText(el)
      styleWriter.write(text)
    })

    resolve()
  })
}

function getJS (dom, pageHost) {
  return new Promise((resolve, reject) => {
    const js = DomUtils.find((el) => {
      // <script (type="text/javascript")? src="...">
      return el.name === 'script' && (el.attribs && el.attribs.src &&
        (!el.attribs.type || el.attribs.type === 'text/javascript'))
    }, dom, true, 32)

    if (js.length === 0) {
      resolve()  // nothing to do
    }

    js.forEach((el, i) => {
      const jsUrl = url.parse(el.attribs.src, false, true)
        console.log('js ', i)

      downloadAndWrite(jsUrl, pageHost, scriptWriter).then(() => {
        if (i === js.length - 1) {
          resolve()
        }
      })
        .catch((err) => {
          console.log(`Error ${url.format(jsUrl)}`, err.message)
          resolve()  // ignore errors
        })
    })
  })
}

function getScripts (dom) {
  return new Promise((resolve, reject) => {
    // <script (type="text/javascript")?>
    const scripts = DomUtils.find((el) => {
      return el.name === 'script' && (!el.attribs || el.attribs.type === 'text/javascript')
    }, dom, true, 32)

    scriptWriter.on('error', reject)

    scripts.forEach((s) => {
      const text = DomUtils.getText(s)
      scriptWriter.write(text)
    })

    resolve()
  })
}

function getBody (dom) {
  return new Promise((resolve, reject) => {
    const body = DomUtils.find((el) => {
      return el.name === 'body'
    }, dom, true, 1)

    const styles = DomUtils.find((el) => {
      return el.name === 'style'
    }, body, true, 32)

    const scripts = DomUtils.find((el) => {
      return el.name === 'script'
    }, body, true, 32)

    // remove styles and scripts from dom
    styles.concat(scripts).forEach((s) => {
      DomUtils.removeElement(s, body)
    })

    const text = DomUtils.getOuterHTML(body)

    bodyWriter.write(text)

    resolve()
  })
}

function findContent (html, pageHost) {
  return new Promise((resolve, reject) => {
    parseDom(html).then((dom) => {
      const css = getCSS(dom, pageHost).catch((err) => console.log(err))
      const styles = getStyles(dom).catch((err) => console.log(err))
      const js = getJS(dom, pageHost).catch((err) => console.log(err))
      const scripts = getScripts(dom).catch((err) => console.log(err))
      const body = getBody(dom).catch((err) => console.log(err))

      Promise.all([css, styles, js, scripts, body]).then(() => {
        console.log('all promises')
        styleWriter.end()
        scriptWriter.end()
        bodyWriter.end()

        resolve({
          css: styleWriter.path,
          js: scriptWriter.path,
          body: bodyWriter.path
        })
      })
        .catch((err) => {
          reject(err)
        })
    })
      .catch((err) => {
        reject(err)
      })
  })
}

module.exports = findContent
