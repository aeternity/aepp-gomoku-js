const jsLoader = 'babel-loader!standard-loader?error=false'

module.exports = {
  mode: process.env.NODE_ENV === 'prod' ? 'production' : 'development',
  entry: './src/server/index.js',
  output: {
    filename: 'server.js'
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: jsLoader,
        exclude: /node_modules/
      }
    ]
  }
}
