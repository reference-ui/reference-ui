// Unit tests for the neo case-folder convention in caseIndex.ts. They build temporary
// case folders and assert the rules: raw-ID folder names, the case.json fields, the README
// first line tied to the case.json name, and that a group folder is not taken for a case.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  caseFolderProblems,
  caseIndexProblems,
  isCaseFolder,
  NEO_CASE_ID,
  readCaseIndex,
  readmeProblems,
} from './caseIndex.ts';

const HEADING_HINT = 'README.md first line must be "# NEO-TYPE-09 — strict colours"';

describe('raw case IDs', () => {
  it('accepts NEO-<GROUP>-<nn> and the one-letter variant the harness probes use', () => {
    expect(NEO_CASE_ID.test('NEO-REF-04')).toBe(true);
    expect(NEO_CASE_ID.test('NEO-PLAY-B-01')).toBe(true);
    expect(NEO_CASE_ID.test('NEO-SNAP-A-01')).toBe(true);
  });

  it('rejects folder names that are not raw IDs', () => {
    for (const name of ['stray-folder', 'NEO-REF-4', 'neo-ref-04', 'ATM-TOKEN-06', 'NEO-REF-04-x']) {
      expect(NEO_CASE_ID.test(name)).toBe(false);
    }
  });
});

describe('case folders on disk', () => {
  let root = '';

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-case-index-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function caseFolder(name: string, files: Record<string, string> = {}, subdirs: string[] = []): string {
    const dir = path.join(root, name);
    fs.mkdirSync(dir);
    for (const [file, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, file), text);
    for (const sub of subdirs) fs.mkdirSync(path.join(dir, sub));
    return dir;
  }

  it('treats a raw-ID folder as a case even before case.json exists', () => {
    expect(isCaseFolder(caseFolder('NEO-REF-02'), 'NEO-REF-02')).toBe(true);
  });

  it('treats a folder holding case.json or specs/ as a case, and a group README-only folder as a group', () => {
    expect(isCaseFolder(caseFolder('stray', { 'case.json': '{}' }), 'stray')).toBe(true);
    expect(isCaseFolder(caseFolder('stray2', {}, ['specs']), 'stray2')).toBe(true);
    expect(isCaseFolder(caseFolder('cli', { 'README.md': '# cli\n' }), 'cli')).toBe(false);
  });

  it('accepts a conforming case folder', () => {
    const dir = caseFolder('NEO-REF-01', {
      'case.json': '{"id": "NEO-REF-01", "name": "recipe defaults", "sync": true}\n',
      'README.md': '# NEO-REF-01 — recipe defaults\n\nbody\n',
    });
    expect(caseFolderProblems('NEO-REF-01', dir)).toEqual([]);
  });

  it('reports a raw-ID folder without case.json with the line to add', () => {
    const dir = caseFolder('NEO-REF-02', { 'README.md': '# NEO-REF-02 — x\n' });
    expect(caseFolderProblems('NEO-REF-02', dir)).toEqual([
      'no case.json; add {"id": "NEO-REF-02", "name": "<one-line claim>"}',
    ]);
  });

  it('reports a case folder whose name is not a raw ID', () => {
    const dir = caseFolder('stray', {
      'case.json': '{"id": "stray", "name": "x"}\n',
      'README.md': '# stray — x\n',
    });
    expect(caseFolderProblems('stray', dir)).toEqual([
      'folder is not named by a raw case ID (NEO-<GROUP>-<nn>)',
    ]);
  });

  it('reports a case.json name that differs from the README claim', () => {
    const dir = caseFolder('NEO-TYPE-09', {
      'case.json': '{"id": "NEO-TYPE-09", "name": "strict colours"}\n',
      'README.md': '# NEO-TYPE-09 — other claim\n',
    });
    expect(caseFolderProblems('NEO-TYPE-09', dir)).toEqual([
      'README.md heading claim "other claim" must equal case.json name "strict colours"',
    ]);
  });
});

describe('case.json fields', () => {
  let root = '';

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-case-json-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function indexOf(json: string): ReturnType<typeof readCaseIndex> {
    const dir = path.join(root, 'NEO-TYPE-09');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'case.json'), json);
    return readCaseIndex(dir);
  }

  it('accepts an id equal to the folder name and a non-empty name', () => {
    expect(caseIndexProblems('NEO-TYPE-09', indexOf('{"id": "NEO-TYPE-09", "name": "x", "sync": true}\n'))).toEqual([]);
  });

  it('reports an id that differs from the folder name', () => {
    expect(caseIndexProblems('NEO-TYPE-09', indexOf('{"id": "NEO-TYPE-10", "name": "x"}\n'))).toEqual([
      'case.json id is "NEO-TYPE-10"; it must equal folder name "NEO-TYPE-09"',
    ]);
  });

  it('reports a missing id and a blank name', () => {
    expect(caseIndexProblems('NEO-TYPE-09', indexOf('{"name": "  "}\n'))).toEqual([
      'case.json id is missing; it must equal folder name "NEO-TYPE-09"',
      'case.json needs a non-empty string "name"',
    ]);
  });

  it('reports invalid JSON and a document that is not an object', () => {
    const invalid = caseIndexProblems('NEO-TYPE-09', indexOf('{"id": "NEO-TYPE-09",'));
    expect(invalid).toHaveLength(1);
    expect(invalid[0]).toMatch(/^case\.json is not valid JSON \(/);
    expect(caseIndexProblems('NEO-TYPE-09', indexOf('["NEO-TYPE-09"]\n'))).toEqual([
      'case.json must be a JSON object',
    ]);
  });
});

describe('README first line', () => {
  it('accepts a first line of "# <folder> — <name>"', () => {
    const readme = '# NEO-TYPE-09 — strict colours\n\nbody\n';
    expect(readmeProblems('NEO-TYPE-09', readme, 'strict colours')).toEqual([]);
  });

  it('accepts CRLF line endings', () => {
    const readme = '# NEO-TYPE-09 — strict colours\r\nbody\r\n';
    expect(readmeProblems('NEO-TYPE-09', readme, 'strict colours')).toEqual([]);
  });

  it('rejects a bare heading, a colon title, and prose as the first line', () => {
    expect(readmeProblems('NEO-TYPE-09', '# NEO-TYPE-09\n', 'strict colours')).toEqual([HEADING_HINT]);
    expect(readmeProblems('NEO-TYPE-09', '# NEO-TYPE-09: strict colours\n', 'strict colours')).toEqual([HEADING_HINT]);
    expect(readmeProblems('NEO-TYPE-09', 'Harness probe: prose\n', 'strict colours')).toEqual([HEADING_HINT]);
  });

  it('reports a heading that names another ID or has an empty claim', () => {
    expect(readmeProblems('NEO-TYPE-09', '# NEO-TYPE-10 — strict colours\n', 'strict colours')).toEqual([
      'README.md heading names "NEO-TYPE-10"; it must name folder "NEO-TYPE-09"',
    ]);
    expect(readmeProblems('NEO-TYPE-09', '# NEO-TYPE-09 — \n', 'strict colours')).toEqual([
      'README.md heading has no claim after the em dash',
    ]);
  });

  it('reports a missing README with the heading to add', () => {
    expect(readmeProblems('NEO-TYPE-09', null, 'strict colours')).toEqual([
      'no README.md; its first line must be "# NEO-TYPE-09 — strict colours"',
    ]);
  });

  it('checks only the ID and claim when no usable name is known', () => {
    expect(readmeProblems('NEO-TYPE-09', '# NEO-TYPE-09 — anything\n', undefined)).toEqual([]);
    expect(readmeProblems('NEO-TYPE-09', null, undefined)).toEqual([
      'no README.md; its first line must be "# NEO-TYPE-09 — <one-line claim>"',
    ]);
  });
});
