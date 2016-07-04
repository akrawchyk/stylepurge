var stylepurge = require('./stylepurge')
var express = require('express')
var bodyParser = require('body-parser')

var app = express()
app.use(bodyParser.json()); // for parsing application/json
app.use(express.static('public'))


app.get('/purge', (req, res, next) => {
  var url = req.query.url
  var urls = req.query.urls

  if (!url && !urls) {
    res.json(JSON.parse('{ "errors": [{ "message": "No URL parameter provided." }] }'))
  } else {
    if (url && !Array.isArray(url)) {
      url = [url]
    }

    if (urls && !Array.isArray(urls)) {
      urls = [urls]
    }

    const u = url || urls

    // const stream = stylepurge(url || urls).pipe(res)
    // stream.on('end', () => {
    //   console.log('express end')
    // })

    // FIXME listen for 'end' event to do res.end instead
    var stream = stylepurge(u)
    let count = 0
    stream.on('data', (chunk) => {
      res.write(chunk)
      count += 1
      if (count === u.length) {
        res.end()
      }
    })

    stream.on('error', (err) => {
      res.status(500).send(err.message)
    })
  }
})


app.listen(8000, () => {
  process.stdout.write('Listening on port 8000\n')
})
