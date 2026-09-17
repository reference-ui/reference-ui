import type * as React from 'react';
import { css } from '@reference-ui/react';

export const meta = { title: 'States', blurb: 'hover, focus, disabled twins' };

const row = css({ p: 'sm', backgroundColor: 'paper', color: 'ink' });

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>States</h1>
      <p>Each pair: the live pseudo-class, then its data-attribute twin preset in the DOM.</p>
      <h2>Hover</h2>
      <div className={css({ _hover: { backgroundColor: 'brand', color: 'paper' }, p: 'sm' })}>
        hover me
      </div>
      <div data-hover className={`${row} ${css({ _hover: { backgroundColor: 'brand', color: 'paper' } })}`}>
        data-hover preset
      </div>
      <h2>Focus</h2>
      <button type="button" className={css({ _focus: { backgroundColor: 'brand', color: 'paper' }, p: 'sm' })}>
        tab to me
      </button>
      <div>
        <span data-focus className={css({ _focus: { backgroundColor: 'brand', color: 'paper' } })}>
          data-focus preset
        </span>
      </div>
      <h2>Disabled</h2>
      <button type="button" disabled className={css({ _disabled: { backgroundColor: 'ink', color: 'paper' }, p: 'sm' })}>
        natively disabled
      </button>
      <div>
        <span data-disabled className={css({ _disabled: { backgroundColor: 'ink', color: 'paper' } })}>
          data-disabled preset
        </span>
      </div>
    </div>
  );
}
