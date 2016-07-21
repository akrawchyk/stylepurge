'use strict'

const url = require('url')
const purifyCss = require('purify-css')
const HTMLGrabber = require('./lib/htmlGrabber')
const findContent = require('./lib/contentFinder')

// TODO cluster HTMLGrabber to support multiple phantom instances
// TODO url array
const dg = new HTMLGrabber({ url: 'https://serviceyr.org' })

dg.on('ready', () => {
  console.log('DOMGrabber ready')
})

dg.on('error', (error) => {
  console.log(error.message)
})

dg.on('html', (html, u) => {
  // (and store that html on disk
  //  and store that url<>path relationship in a db
  // (and store that html in redis
  //  and store that url<>string relationship in redis)

  const pageHost = url.parse(u).host

  findContent(html, pageHost).then((accum) => {
    console.log(accum)

    purifyCss([accum.body, accum.js], [accum.css], { rejected: true }, (purified) => {
      console.log(purified)
    })
  })
    .catch((err) => {
      console.log(err)
    })
})
