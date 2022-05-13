const path = require('path')
const miniCssExtractPlugin = require('mini-css-extract-plugin')
const htmlWebpackPlugin = require('html-webpack-plugin')
const copyWebpackPlugin = require('copy-webpack-plugin')
const terserWebpackPlugin = require('terser-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production' // 在cli中声明

function generatePlugin() {
  // 复制文件
  const copyFile = new copyWebpackPlugin([
    {
      from: 'src/plugin.js',
      to: 'plugin.js'
    },
    {
      from: 'src/plugin.js',
      to: 'plugin.min.js'
    },
    {
      from: 'src/lib',
      to: 'lib',
      // toType: 'dir'
    }
  ])
  // 生成html
  const htmlGen = new htmlWebpackPlugin({
    template: './src/tesseract_ocr/index.html',
    chunks: ['index']
  })
  const plugins = [copyFile, htmlGen]

  if (isProd) {
    const extractCss = new miniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css'
    })
    plugins.push(extractCss)
  }
  
  return plugins
}
const devtool = isProd ? 'hidden-nosources-cheap-source-map' : 'eval-cheap-module-source-map'

module.exports = {
  mode: isProd ? 'production' : 'development',
  devtool,
  entry: {
    // plugin: './src/plugin.js',
    index: './src/tesseract_ocr/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist', 'simple-ocr'),
    filename: (pathData) => {
      return pathData.chunk.name === 'plugin' ? '[name].js' : 'js/[name].[contenthash:8].js';
    },
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          isProd ? miniCssExtraPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader?cacheDirectory'
        ]
      }
    ]
  },
  plugins: generatePlugin(),
  optimization: {
    runtimeChunk: true,
    // minimize: false,
    // minimizer: [
    //   new terserWebpackPlugin({
    //     exclude: /src\/lib/
    //   })
    // ],
    splitChunks: {
      chunks: 'all'
    }
  },
  devServer: {
    port: 8081,
    open: true,
    static: './dist',
    client: {
      overlay: true,
    }
  }
}