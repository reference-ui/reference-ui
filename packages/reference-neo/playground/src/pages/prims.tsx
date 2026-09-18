import type * as React from 'react';
import { Button, Div, Input, Li, P, Section, Span, Ul } from '@reference-ui/react';

export const meta = { title: 'Primitives', blurb: 'tag sample with style props' };

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Primitives</h1>
      <Div color="brand" p="sm" id="prim-div">
        a div with style props
      </Div>
      <P color="ink" id="prim-p">
        a paragraph <Span color="brand">with a nested span</Span>
      </P>
      <Button backgroundColor="ink" color="paper" p="sm" id="prim-button" type="button">
        a button
      </Button>
      <Section p="sm" aria-label="sample section">
        <Ul>
          <Li color="brand">one</Li>
          <Li color="ink">two</Li>
        </Ul>
      </Section>
      <Input placeholder="passthrough input" aria-label="sample input" />
    </div>
  );
}
