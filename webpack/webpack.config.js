const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const CopyWebpackPlugin = require('copy-webpack-plugin')

const config = {
  mode: 'production',
  entry: {
    vendor: [
      'react',
      'react-dom',
      'immutable',
      'isomorphic-fetch',
      'react-transition-group',
      'classnames'
    ],
    app: `${__dirname}/../src/external/index.js`
  },
  devtool: 'cheap-module-source-map',
  output: {
    libraryTarget: 'umd',
    path: `${__dirname}/../dist/external`,
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /(\.jsx?)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          cacheDirectory: true,
          presets: ['@babel/preset-env', '@babel/preset-react']
        }
      },
      {
        test: /\.css/,
        exclude: [/node_modules/],
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          }, {
            loader: 'css-loader',
            options: {
              url: false,
              minimize: true,
              sourceMap: true,
              modules: {
                localIdentName: '[hash:base64:4]'
              }
            }
          }, {
            loader: 'postcss-loader',
            options: {
              config: {
                path: path.join(__dirname, './')
              }
            }
          }
        ]
      }]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'vendor',
      minChunks: Infinity
    }
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../assets'),
          to: path.resolve(__dirname, '../dist/assets')
        }
      ]
    }),
    new MiniCssExtractPlugin({ filename: 'styles.bundle.css' })
  ]
}

module.exports = config
