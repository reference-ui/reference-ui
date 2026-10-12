// Cards route: three composed primitives proving nesting, radius, and shadow
// classes side by side. It takes no props and exports meta (menu title plus
// blurb) and Page, the content the shell renders at #/cards. A plain card, a
// token-inverted dark card, and a full-radius pill show css() utilities
// layered onto Div, P, and Span with no hand-written stylesheet.
import type * as React from 'react';
import { Div, P, Span, css } from '@reference-ui/react';

export const meta = { title: 'Cards', blurb: 'composed primitives' };

const card = css({ backgroundColor: 'paper', borderRadius: 'md', p: 'md', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.18)' });

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Cards</h1>
      <Div className={card} id="card-plain">
        <P color="ink">
          <Span color="brand">Card one.</Span> Primitives nested with radius, padding, and a shadow.
        </P>
      </Div>
      <div style={{ height: '16px' }} />
      <Div className={css({ backgroundColor: 'ink', color: 'paper', borderRadius: 'md', p: 'md' })} id="card-dark">
        <P color="paper">Card two. Inverts with the theme, no shadow.</P>
      </Div>
      <div style={{ height: '16px' }} />
      <Div
        className={css({ backgroundColor: 'brand', color: 'paper', borderRadius: 'full', p: 'sm' })}
        id="card-pill"
      >
        <Span color="paper">Card three. A pill.</Span>
      </Div>
    </div>
  );
}
