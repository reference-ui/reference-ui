import type { TransformArgs } from '@pandacss/types'
import { resolveRhythm } from './helpers'

type RhythmBorderTransformArgs = Pick<TransformArgs, 'raw' | 'token'>

type RhythmBorderTransform = {
  property: string
  values: 'radii'
  transform: (
    value: unknown,
    args: RhythmBorderTransformArgs,
  ) => Record<string, string | number>
}

function resolveBorderRadiusValue(
  value: unknown,
  args: RhythmBorderTransformArgs,
): string | number {
  const raw = typeof args.raw === 'string' ? args.raw : value

  if (typeof raw === 'string' && raw.endsWith('r')) {
    return resolveRhythm(raw)
  }

  if (typeof raw === 'string') {
    return args.token(`radii.${raw}`) ?? (value as string | number)
  }

  return value as string | number
}

const rhythmBorderRadius = (property: string): RhythmBorderTransform => ({
  property,
  values: 'radii',
  transform: (value: unknown, args: RhythmBorderTransformArgs) => ({
    [property]: resolveBorderRadiusValue(value, args),
  }),
})

const rhythmBorderRadiusPair = (
  a: string,
  b: string,
): RhythmBorderTransform => ({
  property: a,
  values: 'radii',
  transform: (value: unknown, args: RhythmBorderTransformArgs) => {
    const resolved = resolveBorderRadiusValue(value, args)
    return { [a]: resolved, [b]: resolved }
  },
})

export const rhythmBorderRadiusUtilities = {
  borderRadius: rhythmBorderRadius('borderRadius'),
  borderTopLeftRadius: rhythmBorderRadius('borderTopLeftRadius'),
  borderTopRightRadius: rhythmBorderRadius('borderTopRightRadius'),
  borderBottomRightRadius: rhythmBorderRadius('borderBottomRightRadius'),
  borderBottomLeftRadius: rhythmBorderRadius('borderBottomLeftRadius'),
  borderTopRadius: rhythmBorderRadiusPair(
    'borderTopLeftRadius',
    'borderTopRightRadius',
  ),
  borderRightRadius: rhythmBorderRadiusPair(
    'borderTopRightRadius',
    'borderBottomRightRadius',
  ),
  borderBottomRadius: rhythmBorderRadiusPair(
    'borderBottomLeftRadius',
    'borderBottomRightRadius',
  ),
  borderLeftRadius: rhythmBorderRadiusPair(
    'borderTopLeftRadius',
    'borderBottomLeftRadius',
  ),
  borderStartStartRadius: rhythmBorderRadius('borderStartStartRadius'),
  borderStartEndRadius: rhythmBorderRadius('borderStartEndRadius'),
  borderEndStartRadius: rhythmBorderRadius('borderEndStartRadius'),
  borderEndEndRadius: rhythmBorderRadius('borderEndEndRadius'),
  borderStartRadius: rhythmBorderRadiusPair(
    'borderStartStartRadius',
    'borderEndStartRadius',
  ),
  borderEndRadius: rhythmBorderRadiusPair(
    'borderStartEndRadius',
    'borderEndEndRadius',
  ),
}
