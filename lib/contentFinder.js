/**
 * Finds and extracts the <body> outerHTML, JS and CSS from an HTML document.
 * Removes JS and CSS from the page.
 */
'use strict'

const DomUtils = require('domutils')
const htmlparser = require('htmlparser2')
const async = require('async')
const temp = require('temp')

temp.track()

function parseDom(html) {
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


function findContent(html) {
  return new Promise((resolve, reject) => {
    const accum = {
      css: '',
      js: '',
      body: ''
    }

    parseDom(html).then((dom) => {
      async.parallel({
        css: (done) => {

          // get style tags
          const styles = DomUtils.find((el) => {
            return el.name === 'style'
          }, dom, true, 8)

          // write file for styles
          const styleWriter = temp.createWriteStream({ suffix: '.css' })

          styleWriter.on('close', () => {
            done(null, styleWriter.path)
          })

          styles.forEach((s) => {
            const text = DomUtils.getText(s)
            styleWriter.write(text)
          })

          styleWriter.close()
        },
        js: (done) => {
          // get script tags
          const scripts = DomUtils.find((el) => {
            return el.name === 'script'
          }, dom, true, 8)

          // write file for scripts
          const scriptWriter = temp.createWriteStream({ suffix: '.js'} )

          scriptWriter.on('close', () => {
            done(null, scriptWriter.path)
          })

          scripts.forEach((s) => {
            const text = DomUtils.getText(s)
            scriptWriter.write(text)
          })

          scriptWriter.close()
        },
        body: (done) => {
          const body = DomUtils.find((el) => {
            return el.name === 'body'
          }, dom, true, 8)

          const styles = DomUtils.find((el) => {
            return el.name === 'style'
          }, body, true, 8)

          styles.forEach((s) => {
            DomUtils.removeElement(s, body)
          })

          const scripts = DomUtils.find((el) => {
            return el.name === 'script'
          }, body, true, 8)

          scripts.forEach((s) => {
            DomUtils.removeElement(s, body)
          })

          const bodyWriter = temp.createWriteStream({ suffix: '.html' })
          // write file for body
          const text = DomUtils.getOuterHTML(body)

          bodyWriter.on('close', () => {
            done(null, bodyWriter.path)
          })

          bodyWriter.write(text)
          bodyWriter.close()
        }
      }, (err, results) => {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      })
    })
  })
}

module.exports = findContent
