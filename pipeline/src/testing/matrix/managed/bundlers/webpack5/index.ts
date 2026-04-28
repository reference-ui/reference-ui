import type { MatrixReactRuntime } from '../../../discovery/index.js'
import { getManagedReactProfile } from '../../react/index.js'

export const managedWebpack5DevDependencies = {
  'css-loader': '^7.1.2',
  'html-webpack-plugin': '^5.6.3',
  'style-loader': '^4.0.0',
  'ts-loader': '^9.5.2',
  webpack: '^5.98.0',
  'webpack-cli': '^6.0.1',
  'webpack-dev-server': '^5.2.0',
} as const

export function createManagedWebpack5IndexHtmlSource(options: {
  reactRuntime: MatrixReactRuntime
  title: string
}): string {
  const reactProfile = getManagedReactProfile(options.reactRuntime)

  return [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${options.title}</title>`,
    '  </head>',
    '  <body>',
    `    <div id="${reactProfile.mountElementId}"></div>`,
    '  </body>',
    '</html>',
    '',
  ].join('\n')
}

export function createManagedWebpack5ConfigSource(): string {
  return [
    "const path = require('node:path')",
    "const HtmlWebpackPlugin = require('html-webpack-plugin')",
    '',
    'module.exports = async () => {',
    "  const { referenceWebpack } = await import('@reference-ui/core')",
    '',
    '  return {',
    "    mode: 'development',",
    "    devtool: 'eval-cheap-module-source-map',",
    "    entry: path.resolve(__dirname, 'src/main.tsx'),",
    '    output: {',
    "      path: path.resolve(__dirname, 'dist'),",
    "      filename: 'bundle.js',",
    '      clean: true,',
    "      publicPath: '/',",
    '    },',
    '    resolve: {',
    "      extensions: ['.tsx', '.ts', '.jsx', '.js'],",
    '      symlinks: true,',
    '    },',
    '    module: {',
    '      rules: [',
    '        {',
    '          test: /\\.tsx?$/',
    '          ,',
    '          exclude: /node_modules/,',
    '          use: {',
    "            loader: 'ts-loader',",
    '            options: {',
    '              transpileOnly: true,',
    '            },',
    '          },',
    '        },',
    '        {',
    '          test: /\\.css$/,',
    "          use: ['style-loader', 'css-loader'],",
    '        },',
    '      ],',
    '    },',
    '    plugins: [',
    '      new HtmlWebpackPlugin({',
    "        template: path.resolve(__dirname, 'index.html'),",
    '      }),',
    '      referenceWebpack(),',
    '    ],',
    '    devServer: {',
    '      port: 4173,',
    '      hot: true,',
    '      liveReload: true,',
    '      historyApiFallback: true,',
    '      static: {',
    '        directory: __dirname,',
    '      },',
    '      client: {',
    '        overlay: true,',
    '      },',
    '    },',
    '  }',
    '}',
    '',
  ].join('\n')
}