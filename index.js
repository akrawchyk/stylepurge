'use strict'

// const cluster = require('cluster')
const purifyCss = require('purify-css')
const DOMGrabber = require('./lib/domGrabber')
const findContent = require('./lib/contentFinder')

// TODO cluster DOMGrabber to support multiple phantom instances



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

  // FIXME purify-css tries to compress the content first. If it fails, it assumes
  //       it isn't JS and then returns the full code, see https://is.gd/fmUuZA
  findContent(html).then((accum) => {
    console.dir(accum)

    purifyCss([accum.body, accum.js], [accum.css], { rejected: true }, (purified) => {
      console.log(purified)
    })
  })
    .catch((err) => {
      console.log(err)
    })

})
