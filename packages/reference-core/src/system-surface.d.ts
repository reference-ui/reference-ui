// Stable type surface for the generated @reference-ui/system entry, read by the pre-run typecheck.
// It takes nothing and declares the authoring calls worlds import, and it runs before the first sync
// writes system.d.mts. The calls take core's real types from @reference-ui/core, which exists before any
// sync, so the pre-run check accepts and rejects what the generated entry does. Only defineConfig keeps a
// wide shape, because ReferenceUIConfig is not narrowed here; worlds promise names for it, not signatures.

import type {
  BaseSystem,
  FontOptions,
  GlobalCssConfig,
  KeyframesConfig,
  RecipeConfig,
  TokenConfig,
} from '@reference-ui/core';
export type {
  FontFaceRule,
  FontWeightName,
  GlobalCssRule,
  ReferenceTokenConfig,
  ReferenceTokenLeaf,
} from '@reference-ui/core';
export type {
  BaseSystem,
  FontOptions,
  GlobalCssConfig,
  KeyframesConfig,
  RecipeConfig,
  TokenConfig,
};

export type ReferenceUIConfig = Record<string, unknown>;
export declare function defineConfig(config: ReferenceUIConfig): ReferenceUIConfig;

export declare function tokens(config: TokenConfig): void;
export declare function keyframes(config: KeyframesConfig): void;
export declare function font(name: string, options: FontOptions): void;
export declare function globalCss(config: GlobalCssConfig): void;
export declare function recipe(config: RecipeConfig): void;

export declare function getRhythm(num: number, denom?: number): string;
export declare const baseSystem: BaseSystem;
