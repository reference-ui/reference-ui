// Stable type surface for the generated @reference-ui/system entry, read by the
// pre-run typecheck. It takes nothing and declares the authoring calls worlds import,
// and it runs before the first sync writes system.d.mts. The four authoring calls were
// wide only to match the emitted entry, which was wide too. They now take core's real
// token, font, keyframes and globalCss types from @reference-ui/core, which exists
// before any sync. defineConfig and baseSystem keep wide shapes: only the four calls
// are narrowed here, and worlds promise names, not signatures.

import type { FontOptions, GlobalCssConfig, KeyframesConfig, TokenConfig } from '@reference-ui/core';
export type {
  FontFaceRule,
  FontWeightName,
  GlobalCssRule,
  ReferenceTokenConfig,
  ReferenceTokenLeaf,
} from '@reference-ui/core';
export type { FontOptions, GlobalCssConfig, KeyframesConfig, TokenConfig };

export type ReferenceUIConfig = Record<string, unknown>;
export type BaseSystem = Record<string, unknown>;
export declare function defineConfig(config: ReferenceUIConfig): ReferenceUIConfig;

export declare function tokens(config: TokenConfig): void;
export declare function keyframes(config: KeyframesConfig): void;
export declare function font(name: string, options: FontOptions): void;
export declare function globalCss(config: GlobalCssConfig): void;

export declare function getRhythm(step: number): string;
export declare const baseSystem: BaseSystem;
