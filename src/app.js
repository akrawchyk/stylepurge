// require('exports?global.Diff2Html!diff2html/dist/diff2html.js')
// require('exports?global.Diff2HtmlUI!diff2html/dist/diff2html-ui.js')
require('exports?global.Diff2Html!diff2html')
require('exports?global.Diff2HtmlUI!diff2html/src/ui/js/diff2html-ui.js')
require('style!css!diff2html/src/ui/css/diff2html.css')
// require('style!css!diff2html/dist/diff2html.css')

// require('style!css!normalize.css')
// require('prismjs')
// require('prismjs/plugins/normalize-whitespace/prism-normalize-whitespace')
// require('prismjs/plugins/line-numbers/prism-line-numbers')
// require('style!css!prismjs/themes/prism-coy.css')
// require('style!css!prismjs/plugins/line-numbers/prism-line-numbers.css')
//
// Prism.plugins.NormalizeWhitespace.setDefaults({
//   'remove-trailing': true,
//   'remove-indent': true,
//   'left-trim': true,
//   'right-trim': true,
//   'indent': 4
// })


fetch('/purge?url=https%3A%2F%2Fserviceyr.org').then((res) => {
  res.json().then((json) => {
    // const el = document.getElementById('output')
    // el.innerHTML = json.diff.join('')

    // Prism.highlightAll()

    const diff2htmlUi = new global.Diff2HtmlUI({ diff: json.diff[0] })
    diff2htmlUi.draw('#line-by-line', { inputFormat: 'json', showFiles: true, matching: 'none' })
  })
})
