import type * as React from 'react';
import { Button, Div, css, recipe } from '@reference-ui/react';

export const meta = { title: 'Pricing', blurb: 'tier table: recipes, rings, container bar' };

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const head = css({ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.08em', color: 'gray.500' });
const title = css({ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', color: 'ink', marginTop: '6px' });
const sub = css({ fontSize: '13px', color: 'gray.500', marginTop: '6px', maxWidth: '560px' });

const tiers = css({ display: 'flex', gap: '16px', marginTop: '20px', alignItems: 'stretch' });

// Featured tier inverts to ink and grows; the compound variant keeps its
// price numeral paper when both meet. Hover lifts the border, never scale.
const tier = recipe({
  className: 'pg-tier',
  base: {
    flex: '1',
    backgroundColor: 'paper',
    color: 'ink',
    borderRadius: 'md',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'gray.200',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    _dark: { borderColor: 'gray.700' },
    _hover: { borderColor: 'cyan.500' },
  },
  variants: {
    featured: {
      no: {},
      yes: {
        backgroundColor: 'ink',
        color: 'paper',
        borderColor: 'ink',
        padding: '28px 20px',
        _dark: { borderColor: 'gray.700' },
      },
    },
  },
  defaultVariants: { featured: 'no' },
});

const tierName = css({ fontFamily: MONO, fontSize: '12px', letterSpacing: '0.08em' });
const tierTag = css({
  fontFamily: MONO,
  fontSize: '11px',
  backgroundColor: 'cyan.500',
  color: '#06202a',
  borderRadius: 'full',
  padding: '2px 10px',
  marginLeft: '8px',
});
const price = css({ fontSize: '34px', fontWeight: '700', letterSpacing: '-0.02em', marginTop: '10px' });
const per = css({ fontSize: '12px', fontWeight: '400', letterSpacing: '0' });
const tierBlurb = css({ fontSize: '13px', marginTop: '6px' });
const feats = css({ listStyle: 'none', margin: '14px 0 0', padding: '0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' });
const featRow = css({ display: 'flex', gap: '8px', alignItems: 'baseline' });
const featTick = css({ fontFamily: MONO, color: 'emerald.500', fontWeight: '700' });
const featOff = css({ color: 'gray.500' });
const ctaSlot = css({ marginTop: 'auto', paddingTop: '18px' });

// Buttons invert on hover via flipping tokens; the ring preset below shows
// the _focusVisible paint without needing a keyboard in the screenshot.
const cta = recipe({
  className: 'pg-cta',
  base: {
    width: '100%',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: 'sm',
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '10px 12px',
    cursor: 'pointer',
    _focusVisible: { outlineColor: 'brand', outlineWidth: '2px', outlineStyle: 'solid', outlineOffset: '2px' },
  },
  variants: {
    tone: {
      primary: {
        backgroundColor: 'cyan.500',
        borderColor: 'cyan.500',
        color: '#06202a',
        _hover: { backgroundColor: 'ink', borderColor: 'ink', color: 'paper' },
      },
      plain: {
        backgroundColor: 'paper',
        borderColor: 'gray.300',
        color: 'ink',
        _dark: { borderColor: 'gray.600' },
        _hover: { backgroundColor: 'ink', borderColor: 'ink', color: 'paper' },
      },
    },
  },
  defaultVariants: { tone: 'plain' },
});

const barHead = css({ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.08em', color: 'gray.500', marginTop: '28px' });
const barNote = css({ fontSize: '12px', color: 'gray.500', marginTop: '4px' });
const root = css({
  container: true,
  marginTop: '10px',
  backgroundColor: 'paper',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  padding: '16px',
  _dark: { borderColor: 'gray.700' },
});
const bar = css({
  width: ['120px', '340px'],
  height: '14px',
  borderRadius: 'full',
  backgroundColor: 'cyan.500',
});
const barCaption = css({ fontFamily: MONO, fontSize: '11px', color: 'gray.500', marginTop: '8px' });
const foot = css({ fontSize: '12px', color: 'gray.500', marginTop: '16px' });

interface TierDef {
  name: string;
  price: string;
  blurb: string;
  featured: boolean;
  tone: 'primary' | 'plain';
  ctaLabel: string;
  feats: Array<{ text: string; off?: boolean }>;
}

const TIERS: TierDef[] = [
  {
    name: 'DRIFT',
    price: '$0',
    blurb: 'For side-channel experiments and weekend relays.',
    featured: false,
    tone: 'plain',
    ctaLabel: 'Start drifting',
    feats: [{ text: '1 relay namespace' }, { text: '7-day telemetry hold' }, { text: 'Community charts', off: true }, { text: 'Uptime oath', off: true }],
  },
  {
    name: 'ORBIT',
    price: '$24',
    blurb: 'For crews shipping a live constellation.',
    featured: true,
    tone: 'primary',
    ctaLabel: 'Enter orbit',
    feats: [{ text: '12 relay namespaces' }, { text: '13-month telemetry hold' }, { text: 'Private charts' }, { text: '99.99% uptime oath' }],
  },
  {
    name: 'DEEP FIELD',
    price: '$96',
    blurb: 'For observatories with their own ground truth.',
    featured: false,
    tone: 'plain',
    ctaLabel: 'Talk to us',
    feats: [{ text: 'Unlimited namespaces' }, { text: 'Frozen audit vault' }, { text: 'Private charts' }, { text: '99.99% uptime oath' }],
  },
];

export function Page(): React.JSX.Element {
  return (
    <div>
      <div className={head}>SIGNAL PLANS · PER RELAY / MO</div>
      <div className={title}>Pay for the sky you actually use</div>
      <div className={sub}>
        Three tiers, one featured. Hover a card to light its border; the middle card inverts to ink and carries the oath.
      </div>
      <div className={tiers} id="pricing-tiers">
        {TIERS.map((tierDef) => (
          <Div key={tierDef.name} className={tier({ featured: tierDef.featured ? 'yes' : 'no' })} id={`pricing-tier-${tierDef.name.toLowerCase().replace(' ', '-')}`}>
            <div className={tierName}>
              {tierDef.name}
              {tierDef.featured ? <span className={tierTag}>MOST DEPLOYED</span> : null}
            </div>
            <div className={price}>
              {tierDef.price} <span className={per}>/ mo</span>
            </div>
            <div className={tierBlurb}>{tierDef.blurb}</div>
            <ul className={feats}>
              {tierDef.feats.map((feat) => (
                <li key={feat.text} className={featRow}>
                  <span className={featTick}>{feat.off ? '—' : '✓'}</span>
                  <span className={feat.off ? featOff : undefined}>{feat.text}</span>
                </li>
              ))}
            </ul>
            <div className={ctaSlot}>
              <Button type="button" className={cta({ tone: tierDef.tone })}>
                {tierDef.ctaLabel}
              </Button>
            </div>
          </Div>
        ))}
      </div>
      <div className={barHead}>FOCUS RING, PRESET TWIN</div>
      <div className={barNote}>
        The quiet button below carries <span className={head}>data-focus-visible</span>, so the capture shows the ring paint with no
        keyboard attached. Tab to the live ones and the same ring lands.
      </div>
      <div style={{ marginTop: '10px', maxWidth: '320px' }}>
        <Button type="button" data-focus-visible className={cta({ tone: 'plain' })}>
          Ring preset via data twin
        </Button>
      </div>
      <div className={barHead}>CONTAINER-GATED BANDWIDTH</div>
      <div className={barNote}>
        The bar below is one width array over a container root: 120px until the root clears the sm gate, then 340px.
      </div>
      <div className={root} id="pricing-root">
        <div className={bar} id="pricing-bar" />
        <div className={barCaption}>bandwidth issue · paints 340px inside this wide root</div>
      </div>
      <p className={foot}>recipe() tiers + CTAs · _hover borders · _focusVisible ring + preset twin · container width array</p>
    </div>
  );
}
