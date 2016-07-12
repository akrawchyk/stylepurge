'use strict'

// const cluster = require('cluster')
const DomUtils = require('domutils')
const EventEmitter = require('events').EventEmitter
const htmlparser = require('htmlparser2')
const phantom = require('phantom')
const purifyCss = require('purify-css')

// TODO cluster DOMGrabber to support multiple phantom instances


function worker(url) {
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

class DOMGrabber extends EventEmitter {
  constructor(opts) {
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

  spawn(url) {
    process.stdout.write(`Spawning phantom for ${url}.\n`)

    if (!url) {
      process.stderr.write('No urls provided.\n')
      process.exit(1)
    }

    if (Array.isArray(url)) {
      process.stderr.write('Urls array not implemented.\n')
      process.exit(1)
    }

    const w = worker(url)
      .then((html) => {
        this.emit('html', html, url)
      })
      .catch((err) => {
        this.emit('error', err)
      })
    //
    // .finally(() => {
    //   const u = urls.slice(1)
    //
    //   if (u.length) {
    //     spawn(u)
    //   } else {
    //     Promise.all(pool).finally(() => {
    //       this.emit('end')
    //     })
    //   }
    // })
  }
}

// we want to call the phantom process
//
// and get back some html as a file
//  - emit event when new html is available
//


const dg = new DOMGrabber({ url: 'http://localhost:8001' })

dg.on('ready', () => {
  console.log('DOMGrabber ready')
})

dg.on('error', (error) => {
  console.log(error.message)
})

dg.on('html', (html, url) => {
  // (and store that html on disk
  //  and store that url<>path relationship in a db
  // (and store that html in redis
  //  and store that url<>string relationship in redis)

  // give html to sax parser for streaming, look ahead for relevant content
  let lookahead = false
  // TODO if i expand the tags in place, I could avoid accumulating JS by just keeping
  //      iti in the HTML
  const accum = {}

  const handler = new htmlparser.DomHandler((error, dom) => {
    if (error) {
      throw error
    } else {
      // get style tags
      // TODO make this plural
      const style = DomUtils.find((el) => {
        return el.name === 'style'
      }, dom, true, 8)
      // get js tags
      accum.css = DomUtils.getText(style)

      const body = DomUtils.find((el) => {
        return el.name === 'body'
      }, dom, true, 8)

      accum.html = DomUtils.getOuterHTML(body)
    }
  })

  // const parser = new htmlparser.Parser({
  //   onopentag: (name, attribs) => {
  //     if (name === 'script' && (!attribs.type || attribs.type.toLowerCase() === 'text/javascript')) {
  //       if (attribs.src) {
  //         // TODO download JS file
  //         process.stdout.write('Downloading scripts not implemented.\n')
  //       }
  //       // no need to lookahead for js since it's in the content already
  //     }
  //
  //     if (name === 'style') {
  //       lookahead = 'css'
  //     }
  //
  //     if (name === 'link' && attribs.rel &&  attribs.rel.toLowerCase() === 'stylesheet') {
  //       // TODO download CSS file
  //       process.stdout.write('Downloading styles not implemented.\n')
  //     }
  //   },
  //   ontext: (text) =>  {
  //     if (lookahead) {
  //       accum[lookahead].push(text)
  //       lookahead = false
  //     }
  //   }
  // }, {
  //   decodeEntities: true,
  //   normalizeWhitespace: true,
  //   lowerCaseTags: true
  // })
  const parser = new htmlparser.Parser(handler)
  parser.write(html)
  parser.end()

  // console.log(html, accum.css)

  // FIXME purify-css tries to compress the content first. If it fails, it assumes
  //       it isn't JS and then returns the full code, see https://is.gd/fmUuZA

  purifyCss(accum.html, accum.css, { rejected: true }, (purified) => {
    console.log(purified)
  })
  // console.dir(accum)
})
