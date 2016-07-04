const gulp = require('gulp')
const gutil = require('gulp-util')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const webpackConfig = require('./webpack.config.js')

// The development server (the recommended option for development)
gulp.task('default', ['webpack-dev-server'])

// Production build
gulp.task('build', ['webpack:build'])

gulp.task('webpack:build', function(next) {
  // modify some webpack config options
  const myConfig = Object.create(webpackConfig)
  myConfig.plugins = myConfig.plugins.concat(
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  )

  // run webpack
  webpack(myConfig, function(err, stats) {
    if(err) throw new gutil.PluginError('webpack:build', err)
    gutil.log('[webpack:build]', stats.toString({
      colors: true
    }))
    next()
  })
})

gulp.task('webpack-dev-server', function(next) {
  // modify some webpack config options
  const myConfig = Object.create(webpackConfig)
  myConfig.devtool = 'eval'
  myConfig.debug = true

  // Start a webpack-dev-server
  new WebpackDevServer(webpack(myConfig), {
    publicPath: '/' + myConfig.output.publicPath,
    contentBase: './' + myConfig.output.publicPath,
    proxy: {
      '/purge': 'http://localhost:8000'
    },
    stats: {
      colors: true
    }
  }).listen(8080, 'localhost', function(err) {
    if(err) throw new gutil.PluginError('webpack-dev-server', err)
    gutil.log('[webpack-dev-server]', 'http://localhost:8080/webpack-dev-server/index.html')
  })
})
