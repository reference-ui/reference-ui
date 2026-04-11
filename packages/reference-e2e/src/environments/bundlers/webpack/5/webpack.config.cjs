const path = require('node:path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = async () => {
  const { referenceWebpack } = await import('@reference-ui/core')
  const port = Number.parseInt(process.env.REF_TEST_PORT ?? '4173', 10)

  return {
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    entry: path.resolve(__dirname, 'main.tsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      clean: true,
      publicPath: '/',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      symlinks: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
      }),
      referenceWebpack(),
    ],
    devServer: {
      port,
      hot: true,
      liveReload: true,
      historyApiFallback: true,
      static: {
        directory: __dirname,
      },
      client: {
        overlay: true,
      },
    },
  }
}