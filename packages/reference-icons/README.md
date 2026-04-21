# @reference-ui/icons

Reference UI's Material Symbols package for React.

It generates a thin icon wrapper layer over `@material-symbols-svg/react`, exposing one component per icon with:

- `variant="outline" | "filled"`
- `size` as a width/height shorthand
- standard React DOM props on the outer inline wrapper

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

## Build

Generated sources live under `src/generated/` and are intentionally not committed. Run `pnpm run build` to regenerate icon sources, refresh the packaged base system, bundle the package, and emit declarations.
