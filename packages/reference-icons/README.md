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

## Development

Generated sources live under `src/generated/` and are intentionally not committed. Rebuild them with `pnpm run icons:generate`, or run `pnpm run build` to generate and compile in one step.

`build` skips Rollup and declaration emit when the source fingerprint matches the last successful build. Set `FORCE_REFERENCE_ICONS_BUILD=1` to force a rebuild.

For a local visual preview, run `pnpm dev` in this package and open the Vite page it prints. That preview is self-contained and intended only for package-level inspection.
