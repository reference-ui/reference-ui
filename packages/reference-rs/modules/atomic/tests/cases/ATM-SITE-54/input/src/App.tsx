import { css } from '@reference-ui/react'
import { gap } from './b'
import { brand } from '@/tokens'
import { deep } from './nested'
import { accent } from './ui'
import { shade } from 'theme-pkg/tokens'

// Collision control: `gap` reads ONLY b.ts (`8px`), never a.ts (`4px`).
export const collision = css({ padding: gap })
// tsconfig paths: `@/tokens` maps through `paths` + `baseUrl`.
export const mapped = css({ color: brand })
// Extension probing: `./nested` lands `nested/index.ts`, `./ui` lands `ui.tsx`.
export const directory = css({ color: deep })
export const probed = css({ color: accent })
// Package exports: `theme-pkg/tokens` maps through the manifest to `dist/`.
export const packaged = css({ color: shade })
