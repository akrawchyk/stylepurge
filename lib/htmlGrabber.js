/**
 * Spawns an instance of PhantomJS and loads a url. Emits the 'html' event with
 * loaded HTML and the url as data arguments.
 */
'use strict'

const Promise = require('bluebird')
const EventEmitter = require('events').EventEmitter
const phantom = require('phantom')

function worker (url) {
  // TODO implement timeout, see https://www.promisejs.org/patterns/#race
  let browser
  let page

  return new Promise((resolve, reject) => {
    phantom.create(['--ignore-ssl-errors=yes'])
      .then((instance) => {
        instance.process.stderr.pipe(process.stderr)
        browser = instance
        return instance.createPage()
      })
      .then((newPage) => {
        page = newPage
        return page.open(url)
      })
      .then((status) => {
        if (!status === 'success') {
          throw new Error(`Phantom status: ${status}`)
        }

        return page.property('content')
      })
      .then((content) => {
        page.close()
        browser.exit()
        resolve(content)
      })
      .catch((err) => {
        browser.exit()
        reject(err)
      })
  })
}

class HTMLGrabber extends EventEmitter {
  constructor (opts) {
    super(opts)

    if (!opts) {
      opts = {}
    }

    process.nextTick(() => {
      if (opts.url) {
        this.emit('ready')
        this.spawn(opts.url)
      } else {
        this.emit('error')
        process.stderr.write('No urls provided.\n')
      }
    })
  }

  spawn (url) {
    process.stdout.write(`Spawning phantom for ${url}.\n`)

    if (!url) {
      process.stderr.write('No urls provided.\n')
      process.exit(1)
    }

    if (Array.isArray(url)) {
      process.stderr.write('Urls array not implemented.\n')
      process.exit(1)
    }

    worker(url)
      .then((html) => {
        this.emit('html', html, url)
      })
      .catch((err) => {
        this.emit('error', err)
      })
  }
}

module.exports = HTMLGrabber
