// NEO-COND-01 route: it shows one _hover rule serving both a live pointer
// state and a data-hover twin. It takes no props and exports meta plus Page,
// painting an ink-to-brand text pair and a surface-flip background pair where
// the lower element already wears the hover paint. The claim it proves is
// that _hover lowers to a single :is(:hover, [data-hover]) selector, so the
// twin shares the exact utility class with no second rule.
import type * as React from 'react';
import { css } from '@reference-ui/react';

export const meta = { title: 'NEO-COND-01 — hover twins', blurb: 'one :is() wrap, live plus twin' };

const card = css({ p: 'sm', borderRadius: 'sm', backgroundColor: 'paper', color: 'ink' });
const liveInk = css({ color: 'ink', _hover: { color: 'brand' }, p: 'sm' });
const twinInk = css({ _hover: { color: 'brand' }, p: 'sm' });
const liveBg = css({ backgroundColor: 'ink', color: 'paper', _hover: { backgroundColor: 'brand' }, p: 'sm', borderRadius: 'sm' });
const twinBg = css({ _hover: { backgroundColor: 'brand' }, color: 'paper', backgroundColor: 'ink', p: 'sm', borderRadius: 'sm' });
const note = css({ fontSize: '12px', color: 'ink' });

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Hover twins</h1>
      <p className={note}>
        NEO-COND-01: every <code>_hover</code> lowers to one <code>:is(:hover, [data-hover])</code> rule, so the live
        element and its <code>data-hover</code> twin share the class. Hover the upper card; the lower card already paints
        the hover state with no pointer anywhere near it.
      </p>
      <h2>Ink to brand</h2>
      <div className={card}>
        <div className={liveInk} id="pg-hover-live">hover me — live :hover</div>
        <div data-hover className={twinInk} id="pg-hover-twin">already brand — data-hover twin</div>
      </div>
      <h2>Surface flip</h2>
      <div className={liveBg} id="pg-hover-live-bg">hover me — live background flip</div>
      <div style={{ height: '8px' }} />
      <div data-hover className={twinBg} id="pg-hover-twin-bg">already flipped — data-hover twin</div>
    </div>
  );
}
