/**
 * Portable design-system artefact emitted by `ref sync`.
 * Shared across config, system/base, and consumers of generated baseSystem files.
 */
export interface BaseSystem {
    name: string;
    /** Bundled fragment IIFEs representing the full upstream config contribution. */
    fragment: string;
    /** Pre-compiled component CSS for layers mode, including any bundled upstream stylesheets. */
    css?: string;
    /** Resolved non-primitive JSX elements contributed by this system and its upstream extends chain. */
    jsxElements?: string[];
}
