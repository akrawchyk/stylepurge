'use strict'

const crawler = require('./crawler')
const finder = require('./finder')
const purifier = require('./purifier')

crawler([
  'https://serviceyr.org',
  // 'https://google.com',
])
  // .pipe(parser)
  // .pipe(process.stdout)
  .pipe(finder())
  .pipe(purifier())
  .pipe(process.stdout)
  .on('error', (err) => {
    process.stderr.write(err.message)
  })
  // .pipe(finder)
// .on('data', (obj) => {
//     console.dir(obj)
//   })
