'use strict'

// TODO explore using cssnano's options interactively to further find
// reductions in CSS size


const beautifyCss = require('js-beautify').css
const CleanCSS = require('clean-css')
const diff2html = require('diff2html')
const spawn = require('child_process').spawn
const temp = require('temp').track()
const StringDecoder = require('string_decoder').StringDecoder
const Transform = require('readable-stream').Transform
const EOL = require('os').EOL

function diff() {
  return new Transform({
    transform(chunk, encoding, next) {
      const decoder = new StringDecoder('utf8')
      const page = JSON.parse(decoder.write(chunk)) // page { url, response }

      // write normalized styles to temp files
      function writeBeautifiedTempFile(prefix, styleText) {
        return new Promise((resolve, reject) => {
          const write = temp.createWriteStream({ prefix: prefix })
          let formattedStyles = new CleanCSS({
            advanced: false,
            aggressiveMerging: false,
            keepBreaks: true,
            restructuring: false
          }).minify(styleText).styles
          formattedStyles = beautifyCss(formattedStyles)
          write.write(formattedStyles)
          write.on('close', () => {
            resolve(write)
          })
          write.on('error', (err) => {
            reject(err)
          })
          write.end()
        })
      }

      Promise.all([
        writeBeautifiedTempFile('original-', page.original),
        writeBeautifiedTempFile('purified-', page.purified),
      ]).then((files) => {
        // diff them
        // console.log('diff ', files.map((file) => file.path))
        const diff = spawn('/usr/bin/diff', [
          '--unified',
          files[0].path,
          files[1].path
        ], { stdio: ['pipe', 'pipe', process.stderr] })

        const diffText = []

        diff.on('error', (err) => {
          next(err)
        })

        diff.stdout.on('data', (data) => {
          diffText.push(data.toString().replace(/\n/g, '\\n'))
        })

        diff.stdout.on('close', () => {
          temp.cleanup()
          next(null, `${JSON.stringify({ "url": page.url, "diff": diffText })}${EOL}`)
        })
      })
    }
  })
}

module.exports = diff
