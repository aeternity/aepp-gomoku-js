const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const PurgecssPlugin = require('purgecss-webpack-plugin')
let glob = require('glob-all')

const jsLoader = 'babel-loader!standard-loader?error=false'

// Custom PurgeCSS extractor for Tailwind that allows special characters in
// class names.
//
// https://github.com/FullHuman/purgecss#extractor
class TailwindExtractor {
  static extract (content) {
    return content.match(/[A-z0-9-:\/]+/g) || [];
  }
}

module.exports = {
  mode: process.env.NODE_ENV === 'prod' ? 'production' : 'development',
  entry: './src/client/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/public')
  },
  resolve: {
    alias: {
      // use this if you are installing the SDK as dependency
      AE_SDK_MODULES: path.resolve(__dirname, 'node_modules/@aeternity/aepp-sdk/es/')
      // use this, if you are running this app from inside the Aepp-SDK repo/folder
      // AE_SDK_MODULES: '../../../../../es/'
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: jsLoader,
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: [
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: './src/client/postcss.config.js'
                }
              }
            }
          ]
          // publicPath: '/web'
        })
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            js: jsLoader
          }
        }
      },
      {
        test: /\.(ttf|eot|svg|gif|png|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Aepp Gomoku',
      template: './src/client/index.html'
    }),
    new PurgecssPlugin({
      // Specify the locations of any files you want to scan for class names.
      paths: glob.sync([
        path.join(__dirname, './src/**/*.vue'),
        path.join(__dirname, './src/index.html')
      ]),
      extractors: [
        {
          extractor: TailwindExtractor,
          // Specify the file extensions to include when scanning for
          // class names.
          extensions: ['html', 'js', 'php', 'vue']
        }
      ]
    }),
    new ExtractTextPlugin('style.css?[hash]'),
    new VueLoaderPlugin()
  ]
}
