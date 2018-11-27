const HtmlWebpackPlugin = require('html-webpack-plugin')

const jsLoader = 'babel-loader!standard-loader?error=false'

module.exports = {
  mode: process.env.NODE_ENV === 'prod' ? 'production' : 'development',
  entry: './src/client/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: jsLoader,
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Aepp Gomoku'
    })
  ]
}
