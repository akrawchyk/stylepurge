const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './src/app.js',
  output: {
    path: path.join(__dirname, 'public/static'),
    publicPath: 'http://localhost:8080/static/',
    filename: 'app.bundle.js',
  },
  loaders: [{
    test: /\.js$/,
    exclude: /(node_modules)/,
    loader: 'babel',
    query: {
      presets: ['es2015'],
      plugins: ['transform-runtime']
    }
  }, {
    test: /\.css$/, loader: 'style!css'
  }, {
    test: /\.png$/, loader: 'url?limit=10000'
  }],
  plugins: [
    new webpack.ProvidePlugin({
      'Promise': 'exports?global.Promise!es6-promise',
      'fetch': 'exports?global.fetch!whatwg-fetch',
      'Prism': 'exports?global.Prism!prismjs'
    })
  ]
}