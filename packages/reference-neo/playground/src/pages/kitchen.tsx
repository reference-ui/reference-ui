import type * as React from 'react';
import { css, recipe } from '@reference-ui/react';

const button = recipe({
  className: 'pg-button',
  base: { color: 'paper', backgroundColor: 'ink', p: 'sm' },
  variants: {
    tone: {
      accent: { backgroundColor: 'brand' },
      muted: { backgroundColor: 'ink' },
    },
    size: {
      sm: { p: 'sm' },
      lg: { p: 'md' },
    },
  },
  defaultVariants: { tone: 'muted', size: 'sm' },
});

const RAMPS = ['violet', 'cyan', 'magenta'] as const;
const STOPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

// Static call per chip: extraction reads literal css() calls, so a dynamic
// `${fam}.${stop}` ref would resolve to nothing. Verbose, honest.
const RAMP_CHIP: Record<string, string> = {
  'violet.50': css({ backgroundColor: 'violet.50', borderRadius: 'sm' }),
  'violet.100': css({ backgroundColor: 'violet.100', borderRadius: 'sm' }),
  'violet.200': css({ backgroundColor: 'violet.200', borderRadius: 'sm' }),
  'violet.300': css({ backgroundColor: 'violet.300', borderRadius: 'sm' }),
  'violet.400': css({ backgroundColor: 'violet.400', borderRadius: 'sm' }),
  'violet.500': css({ backgroundColor: 'violet.500', borderRadius: 'sm' }),
  'violet.600': css({ backgroundColor: 'violet.600', borderRadius: 'sm' }),
  'violet.700': css({ backgroundColor: 'violet.700', borderRadius: 'sm' }),
  'violet.800': css({ backgroundColor: 'violet.800', borderRadius: 'sm' }),
  'violet.900': css({ backgroundColor: 'violet.900', borderRadius: 'sm' }),
  'violet.950': css({ backgroundColor: 'violet.950', borderRadius: 'sm' }),
  'cyan.50': css({ backgroundColor: 'cyan.50', borderRadius: 'sm' }),
  'cyan.100': css({ backgroundColor: 'cyan.100', borderRadius: 'sm' }),
  'cyan.200': css({ backgroundColor: 'cyan.200', borderRadius: 'sm' }),
  'cyan.300': css({ backgroundColor: 'cyan.300', borderRadius: 'sm' }),
  'cyan.400': css({ backgroundColor: 'cyan.400', borderRadius: 'sm' }),
  'cyan.500': css({ backgroundColor: 'cyan.500', borderRadius: 'sm' }),
  'cyan.600': css({ backgroundColor: 'cyan.600', borderRadius: 'sm' }),
  'cyan.700': css({ backgroundColor: 'cyan.700', borderRadius: 'sm' }),
  'cyan.800': css({ backgroundColor: 'cyan.800', borderRadius: 'sm' }),
  'cyan.900': css({ backgroundColor: 'cyan.900', borderRadius: 'sm' }),
  'cyan.950': css({ backgroundColor: 'cyan.950', borderRadius: 'sm' }),
  'magenta.50': css({ backgroundColor: 'magenta.50', borderRadius: 'sm' }),
  'magenta.100': css({ backgroundColor: 'magenta.100', borderRadius: 'sm' }),
  'magenta.200': css({ backgroundColor: 'magenta.200', borderRadius: 'sm' }),
  'magenta.300': css({ backgroundColor: 'magenta.300', borderRadius: 'sm' }),
  'magenta.400': css({ backgroundColor: 'magenta.400', borderRadius: 'sm' }),
  'magenta.500': css({ backgroundColor: 'magenta.500', borderRadius: 'sm' }),
  'magenta.600': css({ backgroundColor: 'magenta.600', borderRadius: 'sm' }),
  'magenta.700': css({ backgroundColor: 'magenta.700', borderRadius: 'sm' }),
  'magenta.800': css({ backgroundColor: 'magenta.800', borderRadius: 'sm' }),
  'magenta.900': css({ backgroundColor: 'magenta.900', borderRadius: 'sm' }),
  'magenta.950': css({ backgroundColor: 'magenta.950', borderRadius: 'sm' }),
};

export const meta = { title: 'Kitchen sink', blurb: 'css, recipe, radius, hover, palette, dark' };

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Kitchen sink</h1>
      <h2>Swatches</h2>
      <div
        className={css({ backgroundColor: 'brand', color: 'paper', p: 'sm' })}
      >
        brand on paper
      </div>
      <div className={css({ backgroundColor: 'ink', color: 'paper', p: 'sm', borderRadius: 'md' })}>
        ink, rounded md
      </div>
      <div className={css({ backgroundColor: 'brand', color: 'paper', p: 'sm', borderRadius: 'full' })}>
        pill, rounded full
      </div>
      <h2>Hover</h2>
      <div className={css({ _hover: { backgroundColor: 'brand', color: 'paper' }, p: 'sm' })}>
        hover me (or set data-hover)
      </div>
      <h2>Recipe</h2>
      <div>
        <span className={button({ tone: 'accent', size: 'sm' })}>accent sm</span>{' '}
        <span className={button({ tone: 'accent', size: 'lg' })}>accent lg</span>{' '}
        <span className={button()}>defaults</span>
      </div>
      <h2>Palette</h2>
      <p style={{ fontSize: '12px' }}>Tailwind ramps, verbatim. Ink/paper/brand carry dark leaves and flip with the shell theme.</p>
      {RAMPS.map((fam) => (
        <div key={fam} style={{ display: 'flex', gap: '4px', marginBottom: '8px', alignItems: 'center' }}>
          <span style={{ width: '64px', fontSize: '12px' }}>{fam}</span>
          {STOPS.map((stop) => (
            <span
              key={stop}
              title={`${fam}.${stop}`}
              className={RAMP_CHIP[`${fam}.${stop}`] ?? ''}
              style={{ display: 'inline-block', width: '28px', height: '28px' }}
            />
          ))}
        </div>
      ))}
      <h2>Dark twins</h2>
      <p style={{ fontSize: '12px' }}>Palette shades have no dark leaves, so explicit _dark twins carry them across themes.</p>
      <div className={css({ backgroundColor: 'violet.500', color: 'paper', p: 'sm', _dark: { backgroundColor: 'violet.950', color: 'violet.200' } })}>
        violet.500 by day, violet.950 by night
      </div>
    </div>
  );
}
