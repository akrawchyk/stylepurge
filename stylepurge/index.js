'use strict'

const crawler = require('./crawler')
const finder = require('./finder')
const ndjson = require('ndjson')

crawler([
  'https://serviceyr.org',
  // 'https://google.com',
])
  .on('error', (err) => {
    process.stderr.write(err.message)
  })
  // .pipe(parser)
  // .pipe(process.stdout)
  .pipe(finder())
  .on('error', (err) => {
    process.stderr.write(err.message)
  })
  // .pipe(process.stdout)
  .on('error', (err) => {
    process.stderr.write(err.message)
  })
  .pipe(process.stdout)
  // .pipe(finder)
// .on('data', (obj) => {
//     console.dir(obj)
//   })
