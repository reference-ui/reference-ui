/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Reference } from '@reference-ui/types'
import { waitForReferenceArtifacts } from './helpers'

describe('Reference component', () => {
  it('loads symbol metadata from the generated Tasty manifest at runtime', async () => {
    const ready = await waitForReferenceArtifacts()
    expect(ready, 'reference manifest should be emitted by the reference worker').toBe(true)

    render(<Reference name="ReferenceApiFixture" />)

    expect(await screen.findByText('label')).toBeInTheDocument()
    expect(screen.getByText('Reference')).toBeInTheDocument()
    expect(screen.getByText('ReferenceApiFixture')).toBeInTheDocument()
    expect(screen.getByText('disabled')).toBeInTheDocument()
    expect(screen.getByText('variant')).toBeInTheDocument()
    expect(screen.getByText(/solid/)).toBeInTheDocument()
    expect(screen.getByText(/ghost/)).toBeInTheDocument()
  })
})
