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
        "import React from 'react'",
        "import ReactDOM from 'react-dom/client'",
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
})