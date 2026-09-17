import type * as React from 'react';
import { css } from '@reference-ui/react';

export const meta = { title: 'NEO-RESP-07 — responsive containers', blurb: 'sm paints only under a root' };

const root = css({ container: true });
const bar = css({ width: ['50px', '60px'] });
const paint = css({ backgroundColor: 'brand', borderRadius: 'sm' });
const panel = css({ backgroundColor: 'paper', color: 'ink', borderRadius: 'sm', p: 'sm' });
const tag = css({ fontSize: '12px', color: 'brand' });
const note = css({ fontSize: '12px', color: 'ink' });
const reading = css({ fontSize: '12px', color: 'ink' });

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Responsive containers</h1>
      <p className={note}>
        NEO-RESP-07: the width array <code>[&apos;50px&apos;, &apos;60px&apos;]</code> lowers to a base utility plus an
        sm rule gated on <code>@container (min-width: 640px)</code>. The same bar class paints 60px only inside a wide
        container root — narrow roots and rootless twins keep the 50px base at any width.
      </p>
      <h2>Rooted and wide — 60px</h2>
      <div className={root} id="pg-rooted-wide" style={{ width: '800px', maxWidth: '100%' }}>
        <div className={panel}>
          <div className={tag}>container root · 800px</div>
          <div style={{ height: '8px' }} />
          <div className={`${bar} ${paint}`} id="pg-probe-wide" style={{ height: '26px' }} />
          <div style={{ height: '6px' }} />
          <div className={reading}>paints 60px — the sm container rule fires</div>
        </div>
      </div>
      <h2>Rooted but narrow — 50px</h2>
      <div className={root} id="pg-rooted-narrow" style={{ width: '400px', maxWidth: '100%' }}>
        <div className={panel}>
          <div className={tag}>container root · 400px</div>
          <div style={{ height: '8px' }} />
          <div className={`${bar} ${paint}`} id="pg-probe-narrow" style={{ height: '26px' }} />
          <div style={{ height: '6px' }} />
          <div className={reading}>paints 50px — base, the container is too narrow</div>
        </div>
      </div>
      <h2>Wide but rootless — 50px</h2>
      <div id="pg-unrooted" style={{ width: '800px', maxWidth: '100%' }}>
        <div className={panel}>
          <div className={tag}>no container root · 800px</div>
          <div style={{ height: '8px' }} />
          <div className={`${bar} ${paint}`} id="pg-probe-unrooted" style={{ height: '26px' }} />
          <div style={{ height: '6px' }} />
          <div className={reading}>paints 50px — base, no root above it</div>
        </div>
      </div>
    </div>
  );
}
