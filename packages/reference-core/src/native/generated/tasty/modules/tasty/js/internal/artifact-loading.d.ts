/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/internal/artifact-loading.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

export type ArtifactImporter = (artifactPath: string) => Promise<unknown>;
export declare function defaultArtifactImporter(artifactPath: string): Promise<unknown>;
export declare function resolveArtifactPath(basePath: string, relativePath: string): Promise<string>;
export declare function resolveArtifactSpecifier(pathOrSpecifier: string): Promise<string>;
export declare function isUrlLike(value: string): boolean;
