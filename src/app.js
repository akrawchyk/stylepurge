require('style!css!normalize.css')
require('prismjs')
require('prismjs/plugins/normalize-whitespace/prism-normalize-whitespace')
require('prismjs/plugins/line-numbers/prism-line-numbers')
require('style!css!prismjs/themes/prism-coy.css')
require('style!css!prismjs/plugins/line-numbers/prism-line-numbers.css')

Prism.plugins.NormalizeWhitespace.setDefaults({
  'remove-trailing': true,
  'remove-indent': true,
  'left-trim': true,
  'right-trim': true,
  'indent': 4
})

fetch('/purge?url=https%3A%2F%2Fserviceyr.org').then((res) => {
  res.json().then((json) => {
    const el = document.getElementById('output')
    el.innerHTML = json.purified

    Prism.highlightAll()
  })
})
