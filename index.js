var fs = require('fs')
var url = require('url')
var Promise = require('bluebird')
var temp = require('temp').track()
var request = require('request')
var purifycss = require('purifycss')
var cssbeautify = require('cssbeautify')
var oust = require('oust')
var argv = require('yargs').argv
var execFile = require('child_process').execFile

function flatten(arr1, arr2) {
  return [arr1, arr2].reduce(function (a, b) {
    return a.concat(b)
  }, [])
}

if (!argv.url) {
  process.stderr.write('No url provided.')
  process.exit(1)
}

var inspectUrl = url.parse(argv.url)

var html = request(inspectUrl.href)
  .pipe(temp.createWriteStream({'suffix': '.html'}))

html.on('close', function () {
  // read file
  var stream = fs.createReadStream(html.path)
  var styles = []
  var scripts = []

  stream.on('error', function (err) {
    process.stderr.write(err.message)
    process.exit(1)
  })

  stream.on('readable', function () {
    // extract stylesheet and javascripts urls
    var contents = stream.read()
    if (!contents) return

    styles = styles.concat(oust(contents, 'stylesheets').filter(function (styleUrl) {
      return url.parse(styleUrl).hostname.endsWith(inspectUrl.hostname)
    }).map(function (styleUrl) {
      return url.parse(styleUrl)
    }))
    // FIXME: also find <script> tags, this just looks for <script src="">
    scripts = scripts.concat(oust(contents, 'scripts').filter(function (styleUrl) {
      return url.parse(styleUrl).hostname.endsWith(inspectUrl.hostname)
    }).map(function (styleUrl) {
      return url.parse(styleUrl)
    }))
  })

  stream.on('close', function () {
    // get stylesheets
    var css = styles.map(function (styleUrl) {
      return new Promise(function (resolve, reject) {
        request(styleUrl.href)
          .pipe(temp.createWriteStream({'suffix': '.css'}))
          .on('close', function () {
            resolve(this.path)
          })
          .on('error', reject)
      })
    })

    // get javascripts
    var js = scripts.map(function (scriptUrl) {
      return new Promise(function (resolve, reject) {
        request(scriptUrl.href)
          .pipe(temp.createWriteStream({'suffix': '.js'}))
          .on('close', function () {
            resolve(this.path)
          })
          .on('error', reject)
      })
    })

    var assets = flatten(js, css)

    Promise.all(assets).then(function (localAssets) {
      var localCss = localAssets.filter(function (a) { return a.endsWith('.css')})
      var localJs = localAssets.filter(function (a) { return a.endsWith('.js')})
      var content = flatten([html.path], localJs)

      purifycss(content, localCss, function (purifiedCss) {
        var writePurifiedCss = temp.createWriteStream({'prefix': 'purified-', 'suffix': '.css'})
        var writeOriginalCss = temp.createWriteStream({'prefix': 'original-', 'suffix': '.css'})

        // write purified css
        var purifiedOutCss = new Promise(function (resolve, reject) {
          writePurifiedCss
            .on('finish', resolve)
            .on('error', reject)
            .end(cssbeautify(purifiedCss, {
              autosemicolon: true
            }))
        })

        var outCss = localCss.map(function (c) {
          // write unminifed original css
          return new Promise(function (resolve, reject) {
            return fs.createReadStream(c)
              .on('readable', function () {
                var contents = this.read()
                if (!contents) return
                writeOriginalCss.write(
                  cssbeautify(contents.toString(), {
                    autosemicolon: true
                  }))
              })
              .on('close', resolve)
              .on('error', reject)
          })
        })

        // wait for both to finish
        outCss.push(purifiedOutCss)

        Promise.all(outCss).then(function () {
          writeOriginalCss.end()
          writeOriginalCss.on('finish', function () {

            // make diff
            execFile('diff', [
              '--unified=3',
              '--ignore-space-change',
              '--ignore-all-space',
              '--ignore-blank-lines',
              writeOriginalCss.path,
              writePurifiedCss.path
            ], {encoding: 'utf8'}, function (err, stdout, stderr) {
              if (stderr) {
                process.stderr.write(stderr)
                process.exit(1)
              } else {
                process.stdout.write(stdout)
              }
            })
          })
        })
      })
    })
  })
})
