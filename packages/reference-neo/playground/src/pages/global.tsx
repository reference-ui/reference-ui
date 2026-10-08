import type * as React from 'react';
import { css } from '@reference-ui/react';

export const meta = { title: 'Global CSS', blurb: 'tag recipes from globalCss' };

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Global CSS</h1>
      <p>Tag recipes below come from globalCss in global.ts — no primitives, no css() calls.</p>
      <button type="button" className="ref-button">
        ref-button (hover me)
      </button>{' '}
      <button type="button" className="ref-button" disabled>
        ref-button disabled
      </button>
      <div className={`ref-card ${css({ backgroundColor: 'paper', color: 'ink' })}`} style={{ marginTop: '16px' }}>
        ref-card with rounded corners and padding from the sheet
      </div>
    </div>
  );
}
