import { tokens } from '@reference-ui/system'

tokens({
  colors: {
    text: {
      value: '#111111',
      dark: '#f5f5f5',
      description: 'Matrix primary text color',
    },
    // Local `_private` subtree. The package owns these tokens, so they
    // remain visible to the package's own MCP surface even though they
    // would be stripped from any downstream consumer that extends this
    // package. See `matrix/mcp/tests/unit/get-tokens.test.ts`.
    _private: {
      matrixSecret: {
        value: '#abcdef',
        description: 'Matrix-local private color, MCP-visible to its owner.',
      },
    },
  },
  spacing: {
    card: {
      value: '1rem',
      description: 'Matrix card spacing',
    },
  },
})
