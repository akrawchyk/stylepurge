'use strict'

const crawler = require('./crawler')
const finder = require('./finder')

crawler([
  'https://serviceyr.org',
  'https://google.com',
])
  .on('error', (err) => {
    process.stderr.write(err.message)
  })
  // .pipe(parser)
  // .pipe(process.stdout)
  .pipe(finder())
  // .pipe(ndjson.parse())
  // .pipe(finder)
// .on('data', (obj) => {
//     console.dir(obj)
//   })
