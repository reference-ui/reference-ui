/**
 * Reference UI dialect CSS extension properties and custom utility prefixes.
 * Declares non-standard layout and styling extensions, gradients, and scroll utilities.
 * Configures atomic class name prefixes and identifies color-bearing extensions.
 */

export interface ExtensionProp {
  name: string;
  css: string;
  classPrefix: string;
  color?: true;
}

export const EXTENSIONS = [
  { name: 'boxSize', css: 'box-size', classPrefix: 'box-size' },
  { name: 'hideFrom', css: 'hide-from', classPrefix: 'hide-from' },
  { name: 'hideBelow', css: 'hide-below', classPrefix: 'hide-below' },
  { name: 'spaceX', css: 'space-x', classPrefix: 'space-x' },
  { name: 'spaceY', css: 'space-y', classPrefix: 'space-y' },
  { name: 'srOnly', css: 'sr-only', classPrefix: 'sr' },
  { name: 'debug', css: 'debug', classPrefix: 'debug' },
  { name: 'textStyle', css: 'text-style', classPrefix: 'textStyle' },
  { name: 'truncate', css: 'truncate', classPrefix: 'truncate' },
  { name: 'gradientFrom', css: 'gradient-from', classPrefix: 'from', color: true },
  { name: 'gradientTo', css: 'gradient-to', classPrefix: 'to', color: true },
  { name: 'gradientVia', css: 'gradient-via', classPrefix: 'via', color: true },
  { name: 'gradientFromPosition', css: 'gradient-from-position', classPrefix: 'gradient-from-position' },
  { name: 'gradientToPosition', css: 'gradient-to-position', classPrefix: 'gradient-to-position' },
  { name: 'gradientViaPosition', css: 'gradient-via-position', classPrefix: 'gradient-via-position' },
  { name: 'textGradient', css: 'text-gradient', classPrefix: 'text-grad' },
  { name: 'backgroundGradient', css: 'background-gradient', classPrefix: 'bg-grad' },
  { name: 'backgroundLinear', css: 'background-linear', classPrefix: 'background-linear' },
  { name: 'backgroundRadial', css: 'background-radial', classPrefix: 'background-radial' },
  { name: 'backgroundConic', css: 'background-conic', classPrefix: 'background-conic' },
  { name: 'textShadowColor', css: 'text-shadow-color', classPrefix: 'text-shadow-color', color: true },
  { name: 'borderStartRadius', css: 'border-start-radius', classPrefix: 'rounded-s' },
  { name: 'borderEndRadius', css: 'border-end-radius', classPrefix: 'rounded-e' },
  { name: 'fontSmoothing', css: 'font-smoothing', classPrefix: 'font-smoothing' },
  { name: 'animationState', css: 'animation-state', classPrefix: 'anim-s' },
  { name: 'webkitTextFillColor', css: 'webkit-text-fill-color', classPrefix: 'webkit-text-fill-color', color: true },
  { name: 'translateX', css: 'translate-x', classPrefix: 'x' },
  { name: 'translateY', css: 'translate-y', classPrefix: 'y' },
  { name: 'translateZ', css: 'translate-z', classPrefix: 'translate-z' },
  { name: 'scrollSnapStrictness', css: 'scroll-snap-strictness', classPrefix: 'scrs-s' },
] as const satisfies readonly ExtensionProp[];
