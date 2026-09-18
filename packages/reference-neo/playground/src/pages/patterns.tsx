import type * as React from 'react';
import { css } from '@reference-ui/react';

export const meta = { title: 'Patterns & motion', blurb: 'blueprints, lattices, live keyframes' };

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const head = css({ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.08em', color: 'gray.500' });
const title = css({ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', color: 'ink', marginTop: '6px' });
const sub = css({ fontSize: '13px', color: 'gray.500', marginTop: '6px', maxWidth: '600px' });

const grid2 = css({ display: 'flex', gap: '16px', marginTop: '20px' });
const swatchCol = css({ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' });

// Pattern paint is raw backgroundImage over a token ground; each carries a
// _dark twin so the linework stays legible on the night canvas.
const swatch = css({
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  overflow: 'hidden',
  _dark: { borderColor: 'gray.700' },
});
const blueprint = css({
  height: '180px',
  backgroundColor: 'sky.950',
  backgroundImage: 'linear-gradient(rgba(125, 211, 252, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(125, 211, 252, 0.22) 1px, transparent 1px), linear-gradient(rgba(125, 211, 252, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(125, 211, 252, 0.4) 1px, transparent 1px)',
  backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
  _dark: {
    backgroundColor: 'gray.900',
    backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.16) 1px, transparent 1px), linear-gradient(rgba(34, 211, 238, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.32) 1px, transparent 1px)',
  },
});
const lattice = css({
  height: '180px',
  backgroundColor: 'paper',
  backgroundImage: 'radial-gradient(circle, #9ca3af 1.2px, transparent 1.3px)',
  backgroundSize: '18px 18px',
  _dark: { backgroundImage: 'radial-gradient(circle, #4b5563 1.2px, transparent 1.3px)' },
});
const scanlines = css({
  height: '180px',
  backgroundColor: '#101014',
  backgroundImage: 'repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.09) 0 2px, transparent 2px 6px)',
});
const ticks = css({
  height: '180px',
  backgroundColor: 'amber.100',
  backgroundImage: 'repeating-linear-gradient(45deg, rgba(120, 53, 15, 0.28) 0 2px, transparent 2px 14px)',
  _dark: { backgroundColor: 'amber.950', backgroundImage: 'repeating-linear-gradient(45deg, rgba(252, 211, 77, 0.25) 0 2px, transparent 2px 14px)' },
});
const swatchTag = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  backgroundColor: 'paper',
  color: 'ink',
  borderWidth: '0',
  borderTopWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  fontFamily: MONO,
  fontSize: '11px',
  _dark: { borderColor: 'gray.700' },
});
const swatchDot = css({ width: '8px', height: '8px', borderRadius: 'full', backgroundColor: 'cyan.500', flexShrink: '0' });

const motionRow = css({ display: 'flex', gap: '16px', marginTop: '16px' });
const motionCell = css({
  flex: '1',
  backgroundColor: 'paper',
  borderRadius: 'md',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'gray.200',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '10px',
  _dark: { borderColor: 'gray.700' },
});
const motionName = css({ fontFamily: MONO, fontSize: '11px', color: 'gray.500' });
const motionStage = css({ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' });

const dotPulse = css({
  width: '18px',
  height: '18px',
  borderRadius: 'full',
  backgroundColor: 'emerald.500',
  animation: 'beacon.pulse',
  _motionReduce: { animation: 'none' },
});
const riseCard = css({
  backgroundColor: 'ink',
  color: 'paper',
  fontFamily: MONO,
  fontSize: '12px',
  borderRadius: 'sm',
  padding: '10px 14px',
  animation: 'rise.in',
  _motionReduce: { animation: 'none' },
});
const sweepTrack = css({ position: 'relative', width: '100%', height: '18px', backgroundColor: 'gray.200', borderRadius: 'full', overflow: 'hidden', _dark: { backgroundColor: 'gray.800' } });
const sweepDot = css({
  width: '18px',
  height: '18px',
  borderRadius: 'full',
  backgroundColor: 'cyan.500',
  animation: 'sweep.x',
  _motionReduce: { animation: 'none' },
});
const dial = css({
  width: '44px',
  height: '44px',
  borderRadius: 'full',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: 'gray.400',
  position: 'relative',
  animation: 'dial.spin',
  _motionReduce: { animation: 'none' },
  _dark: { borderColor: 'gray.500' },
});
const dialTick = css({ position: 'absolute', top: '2px', left: '50%', width: '3px', height: '10px', marginLeft: '-1px', backgroundColor: 'amber.500', borderRadius: 'full' });
const foot = css({ fontSize: '12px', color: 'gray.500', marginTop: '16px' });

// The sweep keyframes travel 1300% of the dot's own width, so the narrow
// dot reads as a ping crossing the track; the wide stage stays honest.
export function Page(): React.JSX.Element {
  return (
    <div>
      <div className={head}>SURFACE LIBRARY · N°04</div>
      <div className={title}>Patterns that earn their pixels</div>
      <div className={sub}>
        Four grounds — drafting blueprint, dot lattice, scope scanlines, hazard ticks — each with a dark twin, then the
        keyframe set running live. Reduced-motion parks every one of them.
      </div>
      <div className={grid2}>
        <div className={swatchCol}>
          <div className={swatch} id="pattern-blueprint">
            <div className={blueprint} />
            <div className={swatchTag}><span className={swatchDot} />BLUEPRINT · 20px MINOR / 100px MAJOR</div>
          </div>
          <div className={swatch} id="pattern-scanlines">
            <div className={scanlines} />
            <div className={swatchTag}><span className={swatchDot} />SCANLINES · FIXED HARDWARE</div>
          </div>
        </div>
        <div className={swatchCol}>
          <div className={swatch} id="pattern-lattice">
            <div className={lattice} />
            <div className={swatchTag}><span className={swatchDot} />LATTICE · 18px DOT PITCH</div>
          </div>
          <div className={swatch} id="pattern-ticks">
            <div className={ticks} />
            <div className={swatchTag}><span className={swatchDot} />HAZARD · 45° / 14px</div>
          </div>
        </div>
      </div>
      <div className={head} style={{ marginTop: '28px' }}>LIVE KEYFRAMES</div>
      <div className={motionRow} id="pattern-motion">
        <div className={motionCell}>
          <div className={motionStage}><span className={dotPulse} id="motion-beacon" /></div>
          <div className={motionName}>beacon.pulse · 2.4s</div>
        </div>
        <div className={motionCell}>
          <div className={motionStage}><span className={riseCard} id="motion-rise">sealed ✓</span></div>
          <div className={motionName}>rise.in · once</div>
        </div>
        <div className={motionCell}>
          <div className={motionStage}>
            <div className={sweepTrack}><div className={sweepDot} id="motion-sweep" /></div>
          </div>
          <div className={motionName}>sweep.x · 3.2s</div>
        </div>
        <div className={motionCell}>
          <div className={motionStage}>
            <div className={dial} id="motion-dial"><span className={dialTick} /></div>
          </div>
          <div className={motionName}>dial.spin · 14s</div>
        </div>
      </div>
      <p className={foot}>raw backgroundImage grounds with _dark twins · all five animation tokens live · _motionReduce on each</p>
    </div>
  );
}
