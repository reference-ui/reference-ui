import type * as React from 'react';
import { Div, css } from '@reference-ui/react';

export const meta = { title: 'NEO-PRIM-07 — colour-mode islands', blurb: 'islands repaint at three depths' };

const tag = css({ fontSize: '12px', color: 'brand' });
const inkText = css({ color: 'ink' });
const swatchShape = css({ borderRadius: 'sm' });
const note = css({ fontSize: '12px', color: 'ink' });

// Frames are fixed chrome (plain inline style): the dark island is always a
// dark card and the nested island always a light card, in both shell themes.
// Only the token-driven paint inside them moves — that contrast is the demo.
const darkFrame = { backgroundColor: '#1a1a20', borderRadius: '12px', padding: '16px', marginTop: '12px' };
const lightFrame = { backgroundColor: '#f2f2f4', borderRadius: '12px', padding: '16px', marginTop: '12px' };
const swatchSize = { width: '72px', height: '28px', flexShrink: 0 };
const probeRow = { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' };

function Swatch({ id }: { id: string }): React.JSX.Element {
  return (
    <Div
      id={id}
      backgroundColor="brand"
      css={{ _dark: { backgroundColor: 'ink' } }}
      className={swatchShape}
      style={swatchSize as React.CSSProperties}
    />
  );
}

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Colour-mode islands</h1>
      <p className={note}>
        NEO-PRIM-07: a <code>colorMode</code> island restamps <code>data-color-mode</code> on its own subtree, so token
        leaves and <code>_dark</code> utilities repaint per depth. The frames stay fixed — only the paint moves. The
        outer surface follows the shell theme; the dark island flips both probes; the nested light island flips the ink
        token back while the swatch keeps its override, which answers to any dark ancestor.
      </p>
      <div>
        <div className={tag}>surface · stamp inherited from &lt;html&gt;</div>
        <div className={inkText} id="pg-ink-surface">ink token follows the shell theme</div>
        <div style={probeRow}>
          <Swatch id="pg-brand-surface" />
          <span className={inkText}>brand until any dark ancestor stands above, then ink</span>
        </div>
      </div>
      <Div colorMode="dark" id="pg-dark-island" style={darkFrame as React.CSSProperties}>
        <div className={tag}>dark island · data-color-mode=&quot;dark&quot;</div>
        <div className={inkText} id="pg-ink-dark">ink token · dark leaf</div>
        <div style={probeRow}>
          <Swatch id="pg-brand-dark" />
          <span className={inkText}>_dark override paints the ink leaf</span>
        </div>
        <Div colorMode="light" id="pg-light-island" style={lightFrame as React.CSSProperties}>
          <div className={tag}>nested light island · data-color-mode=&quot;light&quot;</div>
          <div className={inkText} id="pg-ink-nested">ink token flips back to the light leaf</div>
          <div style={probeRow}>
            <Swatch id="pg-brand-nested" />
            <span className={inkText}>override still paints: a dark ancestor stands above</span>
          </div>
        </Div>
      </Div>
    </div>
  );
}
