var path = require('path');
var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

var config = {
  entry: {
    dist: './scripts/essay.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'essay.js'
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
      
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
          },
          "sass-loader"
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        include: path.join(__dirname, 'src/fonts'),
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      }
    ]
  }
  ,
  plugins: [
    new MiniCssExtractPlugin({
    filename: "essay.css"
      })
    ]
};

if(isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config;
