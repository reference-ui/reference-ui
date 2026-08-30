# Slider tests

Playwright: `matrix/lib/tests/e2e/slider.spec.ts`  
Page: `/slider`

## Unique to Slider

| Our case | Vendor |
| --- | --- |
| Pointer drag; pointer capture outside track | Aria `useSliderThumb`; Zag `thumbDragOffset` (grab edge vs center) |
| Keyboard: arrows step; PageUp/Down large step; Home/End | Aria; radix `PAGE_KEYS` |
| RTL horizontal: arrows reverse | Aria `reverseX`; radix from-left/from-right |
| Vertical orientation | all |
| Two thumbs: cannot cross (neighbour clamp) | Aria `getThumbMinValue`/`Max`; radix `minStepsBetweenThumbs` / `preserveThumbOrder` — freeze clamp vs swap |
| `aria-valuenow` / min / max on each thumb | APG |
| Disabled | all |

## Triple composition

Single thumb, range (two thumbs), vertical.

## Not here

Hidden form `input` / `name`. Thumb swap unless freeze picks it.
