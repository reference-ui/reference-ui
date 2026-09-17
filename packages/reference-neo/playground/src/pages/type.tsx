import type * as React from 'react';
import { css } from '@reference-ui/react';

export const meta = { title: 'Type', blurb: 'sizes, weights, stacks' };

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Type</h1>
      <div className={css({ fontSize: '12px', color: 'ink' })}>12px body small</div>
      <div className={css({ fontSize: '16px', color: 'ink' })}>16px body</div>
      <div className={css({ fontSize: '24px', color: 'ink' })}>24px title</div>
      <div className={css({ fontSize: '32px', fontWeight: '700', color: 'brand' })}>32px bold brand</div>
      <div className={css({ fontSize: '16px', fontWeight: '700', color: 'ink' })}>16px bold ink</div>
      <div className={css({ fontSize: '16px', fontFamily: 'ui-monospace, monospace', color: 'ink' })}>
        mono stack sample
      </div>
    </div>
  );
}
