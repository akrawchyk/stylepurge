var express = require('express')
var app = express()

app.use(express.static(__dirname + '/public'))

// serve index.html
// with examples of style and link tags
// with examples of script tags

app.listen(8001, () => {
  console.log('Test app listening on port 8001')
})
