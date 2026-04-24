import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isAdoptableRegistryProcessCommand,
  parseListeningProcessPid,
} from './runtime.js'

describe('parseListeningProcessPid', () => {
  it('returns the pid from lsof output', () => {
    assert.equal(
      parseListeningProcessPid(
        [
          'COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME',
          'node    53913  ryn   16u  IPv4 0x123      0t0  TCP 127.0.0.1:4873 (LISTEN)',
        ].join('\n'),
      ),
      53913,
    )
  })

  it('returns null when no listening process is present', () => {
    assert.equal(parseListeningProcessPid(''), null)
  })
})

describe('isAdoptableRegistryProcessCommand', () => {
  it('accepts verdaccio command lines', () => {
    assert.equal(isAdoptableRegistryProcessCommand('verdaccio'), true)
    assert.equal(isAdoptableRegistryProcessCommand('/opt/homebrew/bin/verdaccio --config config.yaml'), true)
  })

  it('rejects unrelated node processes', () => {
    assert.equal(isAdoptableRegistryProcessCommand('node ./some-other-server.mjs'), false)
  })
})