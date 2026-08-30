import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createManagedReactMainSource, getManagedReactProfile } from './index.js'

describe('managed react runtime', () => {
  it('describes the managed React 19 dependency surface', () => {
    assert.deepEqual(getManagedReactProfile('react19'), {
      dependencies: {
        react: '^19.2.0',
        'react-dom': '^19.2.0',
      },
      devDependencies: {
        '@types/react': '^19.2.2',
        '@types/react-dom': '^19.2.2',
      },
      mountApi: 'createRoot',
      mountElementId: 'root',
    })
  })

  it('creates the managed main.tsx entrypoint', () => {
    assert.equal(
      createManagedReactMainSource({
        entryImportPath: './Index',
        runtime: 'react19',
      }),
      [
        '/*',
        ' * This file is generated and managed by pipeline.',
        ' */',
        "import React from 'react'",
        "import ReactDOM from 'react-dom/client'",
        '// @ts-ignore',
        "import '@reference-ui/react/styles.css'",
        "import { Index } from './Index'",
        '',
        "ReactDOM.createRoot(document.getElementById('root')!).render(",
        '  <React.StrictMode>',
        '    <Index />',
        '  </React.StrictMode>,',
        ')',
        '',
      ].join('\n'),
    )
  })

  it('describes the managed React 17 dependency surface', () => {
    assert.deepEqual(getManagedReactProfile('react17'), {
      dependencies: {
        react: '^17.0.2',
        'react-dom': '^17.0.2',
      },
      devDependencies: {
        '@types/react': '^17.0.83',
        '@types/react-dom': '^17.0.26',
      },
      mountApi: 'render',
      mountElementId: 'root',
    })
  })

  it('creates the managed React 17 main.tsx entrypoint', () => {
    assert.equal(
      createManagedReactMainSource({
        entryImportPath: './index',
        runtime: 'react17',
      }),
      [
        '/*',
        ' * This file is generated and managed by pipeline.',
        ' */',
        "import React from 'react'",
        "import ReactDOM from 'react-dom'",
        '// @ts-ignore',
        "import '@reference-ui/react/styles.css'",
        "import { Index } from './index'",
        '',
        'ReactDOM.render(',
        '  <React.StrictMode>',
        '    <Index />',
        '  </React.StrictMode>,',
        "  document.getElementById('root')!,",
        ')',
        '',
      ].join('\n'),
    )
  })
})
