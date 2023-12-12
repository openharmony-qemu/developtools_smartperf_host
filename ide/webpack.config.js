// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const isProduction = process.env.NODE_ENV === 'production';
const CopyWebpackPlugin = require('copy-webpack-plugin');
const os = require('os');
const childProcess = require('child_process');
const { exec } = require('child_process');
const fs = require('fs');


function directoryExists(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch (error) {
    return false;
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';
//compile server
((flag) => {
  if (!flag) {
    return;
  }
  console.log('start compile server');
  let outPath = path.normalize(path.join(__dirname, '/', 'dist'));
  let serverSrc = path.normalize(path.join(__dirname, '/server/main.go'));
  if (!directoryExists(outPath)){
    runCommand(`mkdir ${outPath}`);
  } else {
    runCommand(`rm  -rf ${outPath}/* `).then((result)=>{
      
    });
  }
  let rs;
  if (os.type() === 'Windows_NT') {
    rs = childProcess.spawnSync('go', ['build', '-o', outPath, serverSrc], {
      encoding: 'utf-8',
    });
  } else {
    rs = childProcess.spawnSync('go', ['build', '-o', outPath + '/main', serverSrc], {
      encoding: 'utf-8',
    });
  }
  if (rs.status === 0) {
    console.log('compile server success');
  } else {
    console.error('compile server failed', rs);
  }
})(true);
const config = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash].bundle.js',
    clean: false,
  },
  devServer: {
    open: true,
    host: 'localhost',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new CleanWebpackPlugin({
      verbose: true,
      cleanOnceBeforeBuildPatterns: ['!main'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './src/figures',
          to: 'figures',
        },
        {
          from: './src/img',
          to: 'img',
        },
        {
          from: './src/doc',
          to: 'doc',
        },
        {
          from: './src/base-ui/icon.svg',
          to: 'base-ui/icon.svg',
        },
        {
          from: './bin/trace_converter_builtin.js',
          to: 'trace_converter_builtin.js',
        },
        {
          from: './bin/trace_converter_builtin.wasm',
          to: 'trace_converter_builtin.wasm',
        },
        {
          from: './bin/trace_streamer_builtin.js',
          to: 'trace_streamer_builtin.js',
        },
        {
          from: './bin/trace_streamer_builtin.wasm',
          to: 'trace_streamer_builtin.wasm',
        },
        {
          from: './bin/trace_streamer_dubai_builtin.js',
          to: 'trace_streamer_dubai_builtin.js',
        },
        {
          from: './bin/trace_streamer_dubai_builtin.wasm',
          to: 'trace_streamer_dubai_builtin.wasm',
        },
        {
          from: './bin/trace_streamer_sdk_builtin.js',
          to: 'trace_streamer_sdk_builtin.js',
        },
        {
          from: './bin/trace_streamer_sdk_builtin.wasm',
          to: 'trace_streamer_sdk_builtin.wasm',
        },
        {
          from: './third-party/sql-wasm.js',
          to: 'sql-wasm.js',
        },
        {
          from: './third-party/sql-wasm.wasm',
          to: 'sql-wasm.wasm',
        },
        {
          from: './server/version.txt',
          to: 'version.txt',
        },
        {
          from: './server/wasm.json',
          to: 'wasm.json',
        },
      ],
    }),
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
    fallback: {
      fs: false,
      tls: false,
      net: false,
      zlib: false,
      http: false,
      https: false,
      stream: false,
      crypto: false,
      child_process: false,
      path: false, //if you want to use this module also don't forget npm i crypto-browserify
    },
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';

    config.plugins.push(new MiniCssExtractPlugin());
  } else {
    config.mode = 'development';
  }
  return config;
};
