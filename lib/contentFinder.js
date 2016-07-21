/**
 * Finds and extracts the <body> outerHTML, JS and CSS from an HTML document.
 * Removes JS and CSS from the page.
 */
'use strict'

const DomUtils = require('domutils')
const htmlparser = require('htmlparser2')
const temp = require('temp')

temp.track()

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

function getStyles (dom) {
  return new Promise((resolve, reject) => {
    // get style tags
    const styles = DomUtils.find((el) => {
      return el.name === 'style'
    }, dom, true, 8)

    // write file for styles
    const styleWriter = temp.createWriteStream({ suffix: '.css' })

    styleWriter.on('close', () => {
      resolve(styleWriter.path)
    })

    styleWriter.on('error', reject)

    styles.forEach((s) => {
      const text = DomUtils.getText(s)
      styleWriter.write(text)
    })

    styleWriter.end()
  })
}

function getScripts (dom) {
  return new Promise((resolve, reject) => {
    // get script tags
    const scripts = DomUtils.find((el) => {
      return el.name === 'script'
    }, dom, true, 8)

    // write file for scripts
    const scriptWriter = temp.createWriteStream({ suffix: '.js' })

    scriptWriter.on('close', () => {
      resolve(scriptWriter.path)
    })

    scriptWriter.on('error', reject)

    scripts.forEach((s) => {
      const text = DomUtils.getText(s)
      scriptWriter.write(text)
    })

    scriptWriter.end()
  })
}

function getBody (dom) {
  return new Promise((resolve, reject) => {
    const body = DomUtils.find((el) => {
      return el.name === 'body'
    }, dom, true, 8)

    const styles = DomUtils.find((el) => {
      return el.name === 'style'
    }, body, true, 8)

    const scripts = DomUtils.find((el) => {
      return el.name === 'script'
    }, body, true, 8)

    styles.concat(scripts).forEach((s) => {
      DomUtils.removeElement(s, body)
    })

    const bodyWriter = temp.createWriteStream({ suffix: '.html' })
    // write file for body
    const text = DomUtils.getOuterHTML(body)

    bodyWriter.on('close', () => {
      resolve(bodyWriter.path)
    })

    bodyWriter.on('error', reject)

    bodyWriter.write(text)
    bodyWriter.end()
  })
}

function findContent (html) {
  return new Promise((resolve, reject) => {
    parseDom(html).then((dom) => {
      const css = getStyles(dom)
      const js = getScripts(dom)
      const body = getBody(dom)

      Promise.all([css, js, body]).then((accum) => {
        resolve({ css: accum[0], js: accum[1], body: accum[2] })
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
