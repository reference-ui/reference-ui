import type * as React from 'react';
import { Div, Span, css, recipe } from '@reference-ui/react';

export const meta = { title: 'Flight deck', blurb: 'console: beacons, telemetry, log, sweep' };

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// Hover states use flipping tokens (ink/paper) so one _hover paints both
// themes; fixed gray hairlines carry explicit _dark twins instead.
const frame = css({
  backgroundColor: 'paper',
  color: 'ink',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  overflow: 'hidden',
  _dark: { borderColor: 'gray.700' },
});
const strip = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderWidth: '0',
  borderBottomWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  _dark: { borderColor: 'gray.700' },
});
const beacon = css({
  width: '10px',
  height: '10px',
  borderRadius: 'full',
  backgroundColor: 'emerald.500',
  flexShrink: '0',
  animation: 'beacon.pulse',
  _motionReduce: { animation: 'none' },
});
const beaconAmber = css({
  width: '10px',
  height: '10px',
  borderRadius: 'full',
  backgroundColor: 'amber.500',
  flexShrink: '0',
  animation: 'beacon.pulse',
  _motionReduce: { animation: 'none' },
});
const readout = css({ fontFamily: MONO, fontSize: '12px', letterSpacing: '0.06em', color: 'ink' });
const readoutDim = css({ fontFamily: MONO, fontSize: '12px', color: 'gray.500' });
const cursor = css({
  display: 'inline-block',
  width: '8px',
  height: '14px',
  backgroundColor: 'cyan.500',
  animation: 'blink.tick',
  _motionReduce: { animation: 'none' },
});
const stripRight = css({ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' });

const teleRow = css({
  display: 'flex',
  borderWidth: '0',
  borderBottomWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  _dark: { borderColor: 'gray.700' },
});
const teleCell = css({ flex: '1', padding: '14px 16px' });
const teleCellRuled = css({
  flex: '1',
  padding: '14px 16px',
  borderWidth: '0',
  borderLeftWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  _dark: { borderColor: 'gray.700' },
});
const teleLabel = css({ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.08em', color: 'gray.500' });
const teleValue = css({ fontFamily: MONO, fontSize: '26px', fontWeight: '600', color: 'ink', marginTop: '4px' });
const teleSub = css({ fontSize: '11px', color: 'gray.500', marginTop: '2px' });

const chip = recipe({
  className: 'pg-chip',
  base: { fontFamily: MONO, fontSize: '11px', padding: '2px 8px', borderRadius: 'full', color: '#ffffff', flexShrink: '0' },
  variants: {
    severity: {
      ok: { backgroundColor: 'emerald.600' },
      warn: { backgroundColor: 'amber.600' },
      alert: { backgroundColor: 'red.600' },
    },
  },
  defaultVariants: { severity: 'ok' },
});

const logRow = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '9px 16px',
  fontFamily: MONO,
  fontSize: '12px',
  color: 'ink',
  _hover: { backgroundColor: 'ink', color: 'paper' },
});
const logTime = css({ color: 'gray.500', flexShrink: '0' });
const logHead = css({ padding: '12px 16px 4px', fontFamily: MONO, fontSize: '11px', letterSpacing: '0.08em', color: 'gray.500' });

const scopeCaption = css({ padding: '12px 16px', fontSize: '12px', color: 'gray.500' });
const sweepBar = css({
  width: '8%',
  height: '96px',
  backgroundColor: 'cyan.400',
  opacity: '0.8',
  animation: 'sweep.x',
  _motionReduce: { animation: 'none' },
});
const scopeGrid = css({
  height: '96px',
  overflow: 'hidden',
  backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.14) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
});

const note = css({ fontSize: '12px', color: 'gray.500', marginTop: '12px' });

// Fixed instrument screen: always a dark scope in both shell themes, so the
// sweep and grid read as hardware. Only the token-driven bar moves.
const scopeFrame = { backgroundColor: '#0b1220', borderRadius: '0 0 10px 10px' };

const LOG: Array<{ time: string; severity: 'ok' | 'warn' | 'alert'; text: string }> = [
  { time: '04:12:07', severity: 'ok', text: 'relay handshake complete · 12ms' },
  { time: '04:12:31', severity: 'ok', text: 'telemetry batch 4,096 sealed' },
  { time: '04:13:02', severity: 'warn', text: 'uplink jitter above 40ms floor' },
  { time: '04:13:19', severity: 'alert', text: 'relay 2 missed window · retrying' },
  { time: '04:13:40', severity: 'ok', text: 'relay 2 rejoined · skew 3ms' },
];

export function Page(): React.JSX.Element {
  return (
    <div>
      <Div className={frame} id="deck-frame">
        <div className={strip}>
          <span className={beacon} id="deck-beacon" />
          <Span className={readout}>ORBITAL RELAY · NOMINAL</Span>
          <span className={cursor} id="deck-cursor" />
          <div className={stripRight}>
            <span className={beaconAmber} id="deck-beacon-warn" />
            <Span className={readoutDim}>UPLINK DEGRADED</Span>
          </div>
        </div>
        <div className={teleRow} id="deck-telemetry">
          <div className={teleCell}>
            <div className={teleLabel}>SIGNAL</div>
            <div className={teleValue}>98.2%</div>
            <div className={teleSub}>lock stable · 3 relays</div>
          </div>
          <div className={teleCellRuled}>
            <div className={teleLabel}>LATENCY</div>
            <div className={teleValue}>12ms</div>
            <div className={teleSub}>p99 over 5 min</div>
          </div>
          <div className={teleCellRuled}>
            <div className={teleLabel}>SEALED</div>
            <div className={teleValue}>4,096</div>
            <div className={teleSub}>batches this orbit</div>
          </div>
          <div className={teleCellRuled}>
            <div className={teleLabel}>DRIFT</div>
            <div className={teleValue}>0.3°</div>
            <div className={teleSub}>within 1° budget</div>
          </div>
        </div>
        <div className={logHead}>EVENT LOG · HOVER A ROW</div>
        <div id="deck-log">
          {LOG.map((entry) => (
            <div key={entry.time} className={logRow}>
              <span className={logTime}>{entry.time}</span>
              <span className={chip({ severity: entry.severity })}>{entry.severity}</span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
        <Div style={scopeFrame as React.CSSProperties} id="deck-scope">
          <div className={scopeGrid}>
            <div className={sweepBar} id="deck-sweep" />
          </div>
        </Div>
      </Div>
      <p className={scopeCaption}>
        The scope is fixed hardware — identical in both shell themes — while the console frame, telemetry, and log repaint
        from tokens. Hover inverts a log row; every animation parks under prefers-reduced-motion.
      </p>
      <p className={note}>css() utilities · recipe() severity chips · beacon/blink/sweep keyframes · _hover + _motionReduce</p>
    </div>
  );
}
