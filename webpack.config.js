var path = require('path');
var webpack = require("webpack")
var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

var config = {
  //mode: "development",
  entry: {
    dist: './scripts/entry.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'h5p-musicnotation.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader'
      },
      {
        //   test: /\.(scss|css)$/,
        //   use: ['style-loader', 'css-loader', 'sass-loader'],
        //   include: path.join(__dirname, 'src/styles')
        // //   use: [{
        // //     loader: 'style-loader', // inject CSS to page
        // //   }, 
        // //   {
        // //     loader: 'css-loader', // translates CSS into CommonJS modules
        // //   },  
        // //   {
        // //     loader: 'sass-loader' // compiles Sass to CSS
        // //   }]
        // },

        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",

        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "h5p-musicnotation.css"
    }),
    // new FontminPlugin({
    //   autodetect: true,
    //   allowedFilesRegex: /\.(eot|svg|woff|otf)$/
    // }),
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      "api.env": {
        API_KEY: JSON.stringify(process.env.API_KEY),
      }
    })
  ]
};

if (isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config;
