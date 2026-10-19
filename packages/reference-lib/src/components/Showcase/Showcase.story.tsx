/**
 * Showcase story: the composition gallery as CT fixtures. Re-exports the
 * gallery fixture under its resting, active, and default names plus the
 * full-shebang overlay cascade for the Showcase suite to mount.
 */
import * as React from 'react'
import ShowcaseFixture from '../Showcase.book'
import OverlayStories from '../Overlay/Overlay.book'

export const Showcase = () => <ShowcaseFixture />
export const FullShebang = () => <ShowcaseFixture />
export const Default = () => <ShowcaseFixture />
export const FullShebangCascade = OverlayStories.FullShebangCascade

export { ShowcaseFixture }
export default ShowcaseFixture
