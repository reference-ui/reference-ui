/**
 * Primitives story: the Book gallery sections as CT fixtures. Re-exports
 * the All overview plus Forms, Buttons, Selection, Tables, Typography,
 * Code, Inline, Lists, and Disclosure from the shared gallery for the
 * lib-smoke suite to mount.
 */
import * as React from 'react'
import PrimitivesStories, { PrimitivesOverview } from '../Primitives.book'

export const All = () => <PrimitivesOverview />
export const Forms = PrimitivesStories.Forms
export const Buttons = PrimitivesStories.Buttons
export const Selection = PrimitivesStories.Selection
export const Tables = PrimitivesStories.Tables
export const Typography = PrimitivesStories.Typography
export const Code = PrimitivesStories.Code
export const Inline = PrimitivesStories.Inline
export const Lists = PrimitivesStories.Lists
export const Disclosure = PrimitivesStories.Disclosure

export default PrimitivesStories
