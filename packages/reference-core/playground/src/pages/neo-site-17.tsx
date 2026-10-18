// Page for the NEO-SITE-17 slice. It takes the theme query flag and emits
// two chrome dividers whose borderBottomColor rides a component-body const
// ternary — the BookShell subtleBorder shape — so HQ sees both gray arms
// resolve live. Dark paints gray-800, light paints gray-200.
import type * as React from 'react';
import { Div, P } from '@reference-ui/react';

export const meta = { title: 'Site 17 dividers', blurb: 'const-ternary border colors' };

const params = new URLSearchParams(window.location.search);
const isDark = params.get('theme') !== 'light';

function Divider({ id, label }: { id: string; label: string }): React.JSX.Element {
  const subtleBorder = isDark ? 'gray.800' : 'gray.200';
  return (
    <Div id={id} p="md" borderBottom="1px solid" borderBottomColor={subtleBorder}>
      <P color="ink">{label}</P>
    </Div>
  );
}

export function Page(): React.JSX.Element {
  return (
    <div>
      <h1>Const-ternary dividers</h1>
      <Divider id="site17-a" label="First divider: the const ternary resolves the theme arm." />
      <div style={{ height: '16px' }} />
      <Divider id="site17-b" label="Second divider: same const shape, same arm, no currentColor." />
    </div>
  );
}
