// cycle.spec.ts — spec for NEO-CHAIN-11, the fragment-name cycle that fails sync with a named error. It takes
// { case } with the app world synced by the runner. It wires the loop stand-in into the app's extends, expects
// sync() to reject with the named extends error, checks the published base system is byte-identical after the
// rejection, and restores the canonical config with a heal sync in a finally. Emits nothing on success; throws
// one line naming the failed check on failure.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import type { NeoCase } from '../../../../shared/cases.ts'
import { sync } from '../../../../../src/sync/index.ts'
import {
  canonicalConfig,
  restoreDir,
  wireConfig,
  writeConfig,
  type UpstreamLink,
} from '../../shared/upstream.ts'

interface SpecInput {
  case: NeoCase
}

const LOOP_LINK: UpstreamLink = { binding: 'upstreamLoop', from: './theme/loop.ts' }
const EXTENDS_HEADER = "Config field 'extends' is invalid."
const NAMED_REASON =
  "Entry 0 (neo-chain11-loop) reaches 'neo-chain11', this config's own name, so the config would be its own upstream."

// The sync error text, or an empty string when the sync accepted the config.
async function syncFailure(dir: string): Promise<string> {
  try {
    await sync(dir)
    return ''
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const canonical = canonicalConfig(c.worldDir)
  const published = path.join(c.worldDir, '.reference-ui', 'system', 'baseSystem.mjs')
  const before = fs.readFileSync(published, 'utf8')

  try {
    writeConfig(c.worldDir, wireConfig(canonical, [LOOP_LINK], ['upstreamLoop']))
    const message = await syncFailure(c.worldDir)

    assert.ok(message !== '', 'sync accepted an extends entry whose fragment names reach the config');
    assert.ok(message.includes(EXTENDS_HEADER), `the rejection names the extends field, got: ${message}`);
    assert.ok(message.includes(NAMED_REASON), `the rejection names the entry and the reached name, got: ${message}`);
    assert.equal(
      fs.readFileSync(published, 'utf8'),
      before,
      'the rejected sync left the published base system byte-identical'
    );
  } finally {
    await restoreDir(c.worldDir, canonical)
  }
}
