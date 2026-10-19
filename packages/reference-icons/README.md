# @reference-ui/icons

Reference UI's Material Symbols package for React.

It generates a thin icon wrapper layer over `@material-symbols-svg/react`, exposing one component per icon with:

- `variant="outline" | "filled"`
- `size` as a width/height shorthand
- Reference style props and standard React DOM props on the outer inline wrapper

## Install

```sh
pnpm add @reference-ui/icons
```

`react` is a peer dependency.

## Usage

```tsx
import { SearchIcon, HomeIcon } from '@reference-ui/icons'

export function Example() {
	return (
		<div style={{ display: 'flex', gap: 12 }}>
			<SearchIcon size={20} aria-label="Search" />
			<HomeIcon variant="filled" size="1.5rem" aria-label="Home" />
		</div>
	)
}
```

## Styling

Icons take Reference style props like any other component. Your compile
resolves them against your own tokens (`brand` here is one of yours):

```tsx
<CheckIcon color="brand" ml="3r" _hover={{ opacity: 0.7 }} />
```

This needs the icons' system in `extends` or `layers`. If you use
`@reference-ui/lib`, its `baseSystem` already carries it. Otherwise add
`@reference-ui/icons/baseSystem` to `layers`:

```ts
// ui.config.ts
import { defineConfig } from '@reference-ui/core'
import { baseSystem as iconsSystem } from '@reference-ui/icons/baseSystem'

export default defineConfig({
  name: 'my-app',
  include: ['src/**/*.{ts,tsx}'],
  layers: [iconsSystem],
})
```

With neither, `ref sync` warns `ATM-W-EXTERNAL-UNBACKED` at the icon and the
style props do not paint. `size`, `variant`, `style` and `className` work
either way.

## Build

Generated sources live under `src/generated/` and are intentionally not committed. Run `pnpm run build` to regenerate icon sources, refresh the packaged base system, bundle the package, and emit declarations.
