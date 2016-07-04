const StringDecoder = require('string_decoder').StringDecoder
var stylepurge = require('./stylepurge')
var express = require('express')
var bodyParser = require('body-parser')

var app = express()
app.use(bodyParser.json()); // for parsing application/json


app.get('/purge', (req, res) => {
  var url = req.query.url

  if (!url) {
    res.json(JSON.parse('{ "errors": [{ "message": "No URL parameter provided." }] }'))
  } else {
    var stream = stylepurge(url).pipe(res)
  }
})


app.listen(8000, () => {
  process.stdout.write('Listening on port 8000\n')
})
