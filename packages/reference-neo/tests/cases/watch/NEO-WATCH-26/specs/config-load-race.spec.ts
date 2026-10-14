// config-load-race.spec.ts — spec for NEO-WATCH-26, concurrent config loads. Takes { case } from the runner and asserts
// node-side: five config loads of one temp world start together, each after a random delay of up to 4 ms, for 150 rounds.
// Every load must resolve. Emits nothing on success; throws naming the round and the load that failed.
import assert from 'node:assert/strict';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import { loadUserConfigWithDependencies } from '../../../../../src/config/load.ts';
import { disposeWorld, makeWorld, sleep } from '../../shared/commit-world.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const ROUNDS = 150;
const WIDTH = 5;
const JITTER_MS = 4;

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default async function run(_input: SpecInput): Promise<void> {
  const dir = makeWorld();
  try {
    for (let round = 0; round < ROUNDS; round += 1) {
      const loads = Array.from({ length: WIDTH }, async () => {
        await sleep(Math.random() * JITTER_MS);
        return loadUserConfigWithDependencies(dir);
      });
      const settled = await Promise.allSettled(loads);
      settled.forEach((result, load) => {
        const reason = result.status === 'rejected' ? messageOf(result.reason) : '';
        assert.equal(result.status, 'fulfilled', `round ${round}, load ${load} failed: ${reason}`);
      });
    }
  } finally {
    disposeWorld(dir);
  }
}
