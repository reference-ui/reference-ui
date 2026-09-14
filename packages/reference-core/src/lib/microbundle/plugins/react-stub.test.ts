import { describe, expect, it } from 'vitest'
import * as esbuild from 'esbuild'
import { reactStubPlugin } from './react-stub'

describe('reactStubPlugin', () => {
  it('stubs react imports in IIFE bundles into a lightweight proxy', async () => {
    const code = `
      import React, { useState, useEffect } from 'react'
      import ReactDOM from 'react-dom'
      import { jsx } from 'react/jsx-runtime'

      export const Comp = () => React.createElement('div', null, 'hello')
      export const el = jsx('span', { children: 'world' })
    `

    const res = await esbuild.build({
      stdin: { contents: code, sourcefile: 'test.tsx', loader: 'tsx' },
      bundle: true,
      format: 'iife',
      platform: 'node',
      write: false,
      plugins: [reactStubPlugin()],
    })

    const output = res.outputFiles[0].text
    expect(output).toContain('react_default.createElement')
    expect(output).not.toContain('require("react")')
    expect(output.length).toBeLessThan(1500)
  })
})
