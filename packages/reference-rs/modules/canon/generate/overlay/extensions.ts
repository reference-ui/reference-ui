/**
 * Reference UI dialect CSS extension properties: names the dialect adds beyond standard CSS.
 * Each row must ship with a real CSS form: either a longhand expansion (the logical radius
 * shorthands), a plain declaration (`webkitTextFillColor`) or an atomic lowering (`textGradient`).
 * Configures their atomic class name prefixes and marks the color-bearing ones.
 */

export interface ExtensionProp {
  name: string;
  css: string;
  classPrefix: string;
  color?: true;
  longhands?: readonly string[];
}

export const EXTENSIONS = [
  { name: 'textGradient', css: 'text-gradient', classPrefix: 'text-grad' },
  { name: 'borderStartRadius', css: 'border-start-radius', classPrefix: 'rounded-s', longhands: ['borderStartStartRadius', 'borderEndStartRadius'] },
  { name: 'borderEndRadius', css: 'border-end-radius', classPrefix: 'rounded-e', longhands: ['borderStartEndRadius', 'borderEndEndRadius'] },
  { name: 'webkitTextFillColor', css: 'webkit-text-fill-color', classPrefix: 'webkit-text-fill-color', color: true },
] as const satisfies readonly ExtensionProp[];
