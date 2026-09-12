import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MANAGED_REACT_DEPENDENCIES,
  MANAGED_REACT_DEV_DEPENDENCIES,
} from '../../../../../dependencies.js'
import { createManagedReactMainSource, getManagedReactProfile } from './index.js'

describe('managed react runtime', () => {
  it('describes the managed React 19 dependency surface', () => {
    assert.deepEqual(getManagedReactProfile('react19'), {
      dependencies: { ...MANAGED_REACT_DEPENDENCIES.react19 },
      devDependencies: { ...MANAGED_REACT_DEV_DEPENDENCIES.react19 },
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
      dependencies: { ...MANAGED_REACT_DEPENDENCIES.react17 },
      devDependencies: { ...MANAGED_REACT_DEV_DEPENDENCIES.react17 },
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
