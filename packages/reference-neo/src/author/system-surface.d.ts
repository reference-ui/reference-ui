// Stable type surface for the generated @reference-ui/system entry.
// It takes nothing and declares the authoring calls worlds import under the
// pre-run typecheck. Shapes stay wide on purpose — SYNC-12/TYPE-05 narrow them
// against the emitted entry; worlds promise names, not signatures.

export type ReferenceUIConfig = Record<string, unknown>;
export type BaseSystem = Record<string, unknown>;
export declare function defineConfig(config: ReferenceUIConfig): ReferenceUIConfig;

export type TokenConfig = Record<string, unknown>;
export declare function tokens(config: TokenConfig): TokenConfig;

export type KeyframesConfig = Record<string, unknown>;
export declare function keyframes(config: KeyframesConfig): KeyframesConfig;

export type FontDefinition = Record<string, unknown>;
export declare function font(definition: FontDefinition): FontDefinition;

export type GlobalCssConfig = Record<string, unknown>;
export declare function globalCss(config: GlobalCssConfig): GlobalCssConfig;

export type BoxPatternExtension = Record<string, unknown>;
export declare function extendPattern(extension: BoxPatternExtension): BoxPatternExtension;

export declare function getRhythm(step: number): string;
export declare const baseSystem: BaseSystem;
