import type * as React from 'react';
import { Button, Div, css, recipe } from '@reference-ui/react';

export const meta = { title: 'Floating panels', blurb: 'tabs, rings, offset shadows' };

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const head = css({ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.08em', color: 'gray.500' });
const title = css({ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', color: 'ink', marginTop: '6px' });
const sub = css({ fontSize: '13px', color: 'gray.500', marginTop: '6px', maxWidth: '600px' });

// Tabs are a two-axis recipe: the compound paints the loud-active underline
// cyan while quiet-active stays ink. Ring preset on the second tab.
const tab = recipe({
  className: 'pg-tab',
  base: {
    fontFamily: MONO,
    fontSize: '12px',
    letterSpacing: '0.04em',
    backgroundColor: 'transparent',
    borderTopWidth: '0',
    borderLeftWidth: '0',
    borderRightWidth: '0',
    borderBottomWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    color: 'gray.500',
    padding: '10px 14px',
    cursor: 'pointer',
    _hover: { color: 'ink' },
    _focusVisible: { outlineColor: 'brand', outlineWidth: '2px', outlineStyle: 'solid', outlineOffset: '2px' },
  },
  variants: {
    state: {
      idle: {},
      active: { color: 'ink', borderColor: 'ink' },
    },
    emphasis: {
      quiet: {},
      loud: {},
    },
  },
  defaultVariants: { state: 'idle', emphasis: 'quiet' },
  compoundVariants: [{ state: 'active', emphasis: 'loud', css: { borderColor: 'cyan.500', color: 'ink' } }],
});

const tabRow = css({
  display: 'flex',
  gap: '4px',
  marginTop: '16px',
  borderWidth: '0',
  borderBottomWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  _dark: { borderColor: 'gray.700' },
});

const stage = css({ position: 'relative', marginTop: '28px', paddingBottom: '8px' });

// Hard offset shadows sell the float; each panel carries a _dark twin so
// the shadow stays a shadow on the night canvas instead of vanishing.
const panelA = css({
  backgroundColor: 'paper',
  color: 'ink',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  boxShadow: '8px 8px 0 #111111',
  padding: '20px',
  maxWidth: '420px',
  position: 'relative',
  zIndex: '2',
  _dark: { borderColor: 'gray.700', boxShadow: '8px 8px 0 #000000' },
  _hover: { borderColor: 'cyan.500' },
});
const panelB = css({
  backgroundColor: 'ink',
  color: 'paper',
  borderRadius: 'sm',
  padding: '18px 20px',
  maxWidth: '360px',
  marginLeft: 'auto',
  marginTop: '-48px',
  marginRight: '24px',
  position: 'relative',
  zIndex: '3',
  boxShadow: '8px 8px 0 rgba(34, 211, 238, 0.55)',
  _hover: { boxShadow: '8px 8px 0 #22d3ee' },
});
const panelC = css({
  backgroundColor: 'amber.100',
  color: '#451a03',
  borderRadius: 'full',
  padding: '10px 20px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  fontFamily: MONO,
  fontSize: '12px',
  marginTop: '-18px',
  marginLeft: '48px',
  position: 'relative',
  zIndex: '4',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#92400e',
  boxShadow: '4px 4px 0 #451a03',
  _dark: { backgroundColor: 'amber.950', color: 'amber.200', borderColor: 'amber.700', boxShadow: '4px 4px 0 #000000' },
});
const panelKicker = css({ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.08em', color: 'gray.500' });
const panelTitle = css({ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.01em', marginTop: '6px' });
const panelBody = css({ fontSize: '13px', marginTop: '8px', lineHeight: '1.55' });
const panelRow = css({ display: 'flex', gap: '10px', marginTop: '14px' });
const panelBtn = css({
  fontFamily: MONO,
  fontSize: '12px',
  borderRadius: 'sm',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.300',
  backgroundColor: 'paper',
  color: 'ink',
  padding: '8px 14px',
  cursor: 'pointer',
  _dark: { borderColor: 'gray.600' },
  _hover: { backgroundColor: 'ink', color: 'paper', borderColor: 'ink' },
  _focusVisible: { outlineColor: 'brand', outlineWidth: '2px', outlineStyle: 'solid', outlineOffset: '2px' },
});
const panelBtnSolid = css({
  fontFamily: MONO,
  fontSize: '12px',
  borderRadius: 'sm',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'cyan.500',
  backgroundColor: 'cyan.500',
  color: '#06202a',
  padding: '8px 14px',
  cursor: 'pointer',
  _hover: { backgroundColor: 'transparent', color: 'cyan.500' },
  _focusVisible: { outlineColor: 'brand', outlineWidth: '2px', outlineStyle: 'solid', outlineOffset: '2px' },
});
const badgeDot = css({ width: '8px', height: '8px', borderRadius: 'full', backgroundColor: 'emerald.500', flexShrink: '0', animation: 'beacon.pulse', _motionReduce: { animation: 'none' } });

const cards = css({ display: 'flex', gap: '16px', marginTop: '32px' });
const cardWide = css({
  flex: '1.6',
  backgroundColor: 'paper',
  color: 'ink',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  padding: '20px',
  _dark: { borderColor: 'gray.700' },
  _hover: { borderColor: 'cyan.500' },
});
const cardNarrow = css({
  flex: '1',
  backgroundColor: 'paper',
  color: 'ink',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  padding: '20px',
  _dark: { borderColor: 'gray.700' },
  _hover: { borderColor: 'cyan.500' },
});
const cardNum = css({ fontFamily: MONO, fontSize: '30px', fontWeight: '600', color: 'ink', marginTop: '6px' });
const foot = css({ fontSize: '12px', color: 'gray.500', marginTop: '16px' });

const TABS: Array<{ label: string; state: 'active' | 'idle'; emphasis: 'loud' | 'quiet'; twin?: boolean }> = [
  { label: 'OVERVIEW', state: 'active', emphasis: 'loud' },
  { label: 'RELAYS', state: 'idle', emphasis: 'quiet', twin: true },
  { label: 'VAULT', state: 'idle', emphasis: 'quiet' },
  { label: 'OATHS', state: 'idle', emphasis: 'quiet' },
];

export function Page(): React.JSX.Element {
  return (
    <div>
      <div className={head}>LAYERS · N°05</div>
      <div className={title}>Panels that float on purpose</div>
      <div className={sub}>
        A tab strip with a compound-variant underline, then three panels stacked with hard offset shadows and a live
        status pill. Hover the borders; tab through for rings.
      </div>
      <div className={tabRow} id="panels-tabs" role="tablist" aria-label="Panel views">
        {TABS.map((tabDef) => (
          <Button
            key={tabDef.label}
            type="button"
            role="tab"
            aria-selected={tabDef.state === 'active'}
            data-focus-visible={tabDef.twin ? true : undefined}
            className={tab({ state: tabDef.state, emphasis: tabDef.emphasis })}
          >
            {tabDef.label}
          </Button>
        ))}
      </div>
      <div className={stage} id="panels-stage">
        <Div className={panelA} id="panel-a">
          <div className={panelKicker}>PANEL A · BRIEFING</div>
          <div className={panelTitle}>The constellation at a glance</div>
          <div className={panelBody}>
            Twelve relays, one oath, zero missed windows this orbit. The board below carries the live counts; the pill
            underneath never sleeps.
          </div>
          <div className={panelRow}>
            <Button type="button" className={panelBtn}>Open board</Button>
            <Button type="button" className={panelBtn}>Export</Button>
          </div>
        </Div>
        <Div className={panelB} id="panel-b">
          <div className={panelKicker}>PANEL B · LIVE COUNTS</div>
          <div className={panelTitle}>4,096 batches sealed</div>
          <div className={panelBody}>Hover this panel and its cyan shadow goes solid. Ink grounds need no dark twin.</div>
          <div className={panelRow}>
            <Button type="button" className={panelBtnSolid}>Watch live</Button>
          </div>
        </Div>
        <div className={panelC} id="panel-c">
          <span className={badgeDot} />
          ALL RELAYS NOMINAL · ORBIT 1,204
        </div>
      </div>
      <div className={cards} id="panels-cards">
        <div className={cardWide}>
          <div className={panelKicker}>SEALED THIS ORBIT</div>
          <div className={cardNum}>4,096</div>
          <div className={panelBody}>Wide card, narrow card — asymmetric on purpose. Borders light cyan on hover.</div>
        </div>
        <div className={cardNarrow}>
          <div className={panelKicker}>MISSED WINDOWS</div>
          <div className={cardNum}>0</div>
          <div className={panelBody}>The only number that matters.</div>
        </div>
      </div>
      <p className={foot}>two-axis tab recipe + compound underline · _focusVisible ring + preset twin · offset shadows with _dark twins</p>
    </div>
  );
}
