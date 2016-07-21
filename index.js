'use strict'

// const cluster = require('cluster')
const purifyCss = require('purify-css')
const HTMLGrabber = require('./lib/htmlGrabber')
const findContent = require('./lib/contentFinder')

// TODO cluster DOMGrabber to support multiple phantom instances

// we want to call the phantom process
//
// and get back some html as a file
//  - emit event when new html is available
//

const dg = new HTMLGrabber({ url: 'https://themobileys.com/' })

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

  findContent(html).then((accum) => {
    purifyCss([accum.body, accum.js], [accum.css], { rejected: true }, (purified) => {
      console.log(purified)
    })
  })
    .catch((err) => {
      console.log(err)
    })
})
