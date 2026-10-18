// group-peer.spec.ts — spec for NEO-COND-11, the group/peer case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing wrap, the miscounted utility, or the group/peer arm that fails
// to paint on failure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The runner hands specs the real Playwright page, whose hover member the
// narrow SpecPage shape omits; this interface names just that member.
interface HoverPage {
  hover(selector: string): Promise<void>;
}

// Three utilities, two wraps, four paints. The sheet carries one shared
// base plus a conditioned class per target with the group and peer
// ancestor wraps, the group child rests on ink and paints brand under a
// real hover of the group, and the peer sibling rests on ink and paints
// brand while the preceding peer holds focus.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const styles = fs.readFileSync(
    path.join(c.worldDir, '.reference-ui/styled/styles.css'),
    'utf8',
  );
  const hits = styles.match(/\.neo-cond-11__[^{\s,]*/g) ?? [];
  assert.equal(new Set(hits).size, 3, `sheet mints three classes, got ${new Set(hits).size}`);
  assert.ok(
    styles.includes(':where(.group, [data-group])'),
    'sheet carries the group ancestor wrap',
  );
  assert.ok(
    styles.includes(':where(.peer, [data-peer])'),
    'sheet carries the peer preceding wrap',
  );

  const groupTarget = page.locator('#groupTarget');
  await groupTarget.waitFor();
  const groupRested = await groupTarget.evaluate((el) => getComputedStyle(el).color);
  assert.equal(groupRested, 'rgb(17, 17, 17)', `group child rests on ink, got ${groupRested}`);

  const hoverPage = page as unknown as HoverPage;
  await hoverPage.hover('#group');
  const groupHovered = await groupTarget.evaluate((el) => getComputedStyle(el).color);
  assert.equal(groupHovered, 'rgb(124, 58, 237)', `hovering the group paints brand, got ${groupHovered}`);

  await hoverPage.hover('#plain');
  const groupReleased = await groupTarget.evaluate((el) => getComputedStyle(el).color);
  assert.equal(groupReleased, 'rgb(17, 17, 17)', `leaving restores ink, got ${groupReleased}`);

  const peerTarget = page.locator('#peerTarget');
  await peerTarget.waitFor();
  const peerRested = await peerTarget.evaluate((el) => getComputedStyle(el).color);
  assert.equal(peerRested, 'rgb(17, 17, 17)', `peer sibling rests on ink, got ${peerRested}`);

  const peer = page.locator('#peer');
  await peer.evaluate((el) => el.focus());
  const peerFocused = await peerTarget.evaluate((el) => getComputedStyle(el).color);
  assert.equal(peerFocused, 'rgb(124, 58, 237)', `focusing the peer paints brand, got ${peerFocused}`);

  await peer.evaluate((el) => el.blur());
  const peerBlurred = await peerTarget.evaluate((el) => getComputedStyle(el).color);
  assert.equal(peerBlurred, 'rgb(17, 17, 17)', `blur restores ink, got ${peerBlurred}`);
}
