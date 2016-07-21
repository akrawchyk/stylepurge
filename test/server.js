const path = require('path')
const finalhandler = require('finalhandler')
const http = require('http')
const serveStatic = require('serve-static')

// Serve up public/ftp folder
const serve = serveStatic(path.join(__dirname, 'public'), { index: ['index.html'] })

// Create server
const server = http.createServer(function onRequest (req, res) {
  serve(req, res, finalhandler(req, res))
})

server.listen(8001)
