export const manifest = {
  version: '2',
  warnings: [
    'Duplicate symbol name "Shared" matched 2 entries: _c6d8bd1e192848a5 (user), _b899721439429933 (user). Use symbol id or scoped lookup to disambiguate.',
  ],
  symbolsByName: { Shared: ['_c6d8bd1e192848a5', '_b899721439429933'] },
  symbolsById: {
    _b899721439429933: {
      id: '_b899721439429933',
      name: 'Shared',
      kind: 'typeAlias',
      chunk: './chunks/_b899721439429933.js',
      library: 'user',
    },
    _c6d8bd1e192848a5: {
      id: '_c6d8bd1e192848a5',
      name: 'Shared',
      kind: 'interface',
      chunk: './chunks/_c6d8bd1e192848a5.js',
      library: 'user',
    },
  },
}
export default manifest
