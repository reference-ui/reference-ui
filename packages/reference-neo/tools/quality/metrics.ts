/**
 * Targeted complexity counting over the TypeScript compiler API, in the rs shape.
 * It takes absolute file paths, parses each through one inferred-project snapshot, and emits
 * per-function branch, depth, parameter, and line counts plus per-file totals for the gate tiers.
 * Matching is kind-based, so type positions can never inflate value metrics: conditional types
 * are a different node kind than conditional expressions, and optional markers are not nodes.
 */
import { createRequire } from 'node:module';
import { countLines, readTextFileSync } from './files.ts';

const LOCAL_REQUIRE: NodeRequire = createRequire(import.meta.url);

export interface FunctionMetric {
  file: string;
  line: number;
  name: string;
  params: number;
  depth: number;
  lines: number;
  cyclomatic: number;
}

export interface FileMetric {
  file: string;
  lines: number;
}

export interface MetricsResult {
  functions: FunctionMetric[];
  files: FileMetric[];
}

// Structural view of the compiler nodes the counter touches. The real
// ts.Node carries far more, but kind, body, name, and span are all the
// walk reads, so the interface names only those members.
interface TsNode {
  kind: number;
  body?: TsNode;
  name?: { text?: string };
  parameters?: Array<{ name?: { text?: string } }>;
  operatorToken?: { kind: number };
  getStart(): number;
  getEnd(): number;
}

type VisitEachChild = (node: TsNode, visitor: (child: TsNode | undefined) => TsNode | undefined) => void;

interface TsProgram {
  getSourceFile(file: string): TsNode | undefined;
}

interface TsProject {
  program: TsProgram;
}

interface TsSnapshot {
  getDefaultProjectForFile(file: string): TsProject | undefined;
  getProjects(): TsProject[];
  dispose(): void;
}

interface TsApi {
  updateSnapshot(opts: { openFiles: string[] }): TsSnapshot;
  close(): void;
}

type TsApiClass = new () => TsApi;

interface TsModules {
  API: TsApiClass;
  SyntaxKind: Record<string, number>;
  visitEachChild: VisitEachChild;
}

interface KindSets {
  functionLike: Set<number>;
  control: Set<number>;
  branch: Set<number>;
  binary: number;
  and: number;
  or: number;
  coalesce: number;
  ctor: number;
}

interface MeasureJob {
  file: string;
  text: string;
  kinds: KindSets;
  visitEachChild: VisitEachChild;
  functions: FunctionMetric[];
}

function loadTs(): TsModules {
  try {
    const syncMod = LOCAL_REQUIRE('typescript/unstable/sync') as { API: TsApiClass };
    const astMod = LOCAL_REQUIRE('typescript/unstable/ast') as { SyntaxKind: Record<string, number>; visitEachChild: VisitEachChild };
    return { API: syncMod.API, SyntaxKind: astMod.SyntaxKind, visitEachChild: astMod.visitEachChild };
  } catch (err) {
    const missing = new Error('neo/metrics: the typescript package is not resolvable; install dependencies and rerun.') as Error & {
      code: string;
    };
    missing.code = 'NEO_TOOLING_MISSING';
    missing.cause = err;
    throw missing;
  }
}

function kindSets(SyntaxKind: Record<string, number>): KindSets {
  const set = (names: string[]): Set<number> => new Set(names.map((n) => SyntaxKind[n]));
  return {
    functionLike: set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunction', 'MethodDeclaration', 'Constructor', 'GetAccessor', 'SetAccessor']),
    control: set(['IfStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoStatement', 'SwitchStatement', 'CatchClause']),
    branch: set([
      'IfStatement',
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoStatement',
      'CaseClause',
      'CatchClause',
      'ConditionalExpression',
    ]),
    binary: SyntaxKind['BinaryExpression'],
    and: SyntaxKind['AmpersandAmpersandToken'],
    or: SyntaxKind['BarBarToken'],
    coalesce: SyntaxKind['QuestionQuestionToken'],
    ctor: SyntaxKind['Constructor'],
  };
}

function isBranch(node: TsNode, kinds: KindSets): boolean {
  if (kinds.branch.has(node.kind)) return true;
  if (node.kind !== kinds.binary) return false;
  const op = node.operatorToken?.kind;
  return op === kinds.and || op === kinds.or || op === kinds.coalesce;
}

function lineStarts(text: string): number[] {
  const starts: number[] = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineOf(starts: number[], pos: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

function functionName(fn: TsNode, kinds: KindSets): string {
  if (fn.name?.text) return fn.name.text;
  if (fn.kind === kinds.ctor) return 'constructor';
  return '(anonymous)';
}

function countBody(fn: TsNode, kinds: KindSets, visitEachChild: VisitEachChild): { cyclomatic: number; depth: number } {
  let cyclomatic = 1;
  let depth = 0;
  const visit = (node: TsNode, nesting: number): void => {
    if (node !== fn && kinds.functionLike.has(node.kind)) return;
    let next = nesting;
    if (kinds.control.has(node.kind)) {
      next = nesting + 1;
      if (next > depth) depth = next;
    }
    if (isBranch(node, kinds)) cyclomatic += 1;
    visitEachChild(node, (child) => {
      if (child) visit(child, next);
      return child;
    });
  };
  visit(fn, 0);
  return { cyclomatic, depth };
}

function collectFunctions(sf: TsNode, kinds: KindSets, visitEachChild: VisitEachChild, out: TsNode[]): void {
  const visit = (node: TsNode): void => {
    if (node !== sf && kinds.functionLike.has(node.kind) && node.body) out.push(node);
    visitEachChild(node, (child) => {
      if (child) visit(child);
      return child;
    });
  };
  visit(sf);
}

function readTexts(files: string[]): { texts: Map<string, string>; rows: FileMetric[] } {
  const texts = new Map<string, string>();
  const rows: FileMetric[] = [];
  for (const file of files) {
    const text = readTextFileSync(file);
    if (text === null) continue;
    texts.set(file, text);
    rows.push({ file, lines: countLines(text) });
  }
  return { texts, rows };
}

function measureOne(sf: TsNode, job: MeasureJob): void {
  const fns: TsNode[] = [];
  collectFunctions(sf, job.kinds, job.visitEachChild, fns);
  const starts = lineStarts(job.text);
  for (const fn of fns) {
    const { cyclomatic, depth } = countBody(fn, job.kinds, job.visitEachChild);
    const start = lineOf(starts, fn.getStart());
    const end = lineOf(starts, fn.getEnd());
    const params = (fn.parameters ?? []).filter((p) => p.name?.text !== 'this').length;
    job.functions.push({
      file: job.file,
      line: start,
      name: functionName(fn, job.kinds),
      params,
      depth,
      lines: end - start + 1,
      cyclomatic,
    });
  }
}

export function measureFiles(files: string[]): MetricsResult {
  const { API, SyntaxKind, visitEachChild } = loadTs();
  const kinds = kindSets(SyntaxKind);
  const { texts, rows } = readTexts(files);
  const functions: FunctionMetric[] = [];
  if (texts.size === 0) return { functions, files: rows };
  const api = new API();
  try {
    const snap = api.updateSnapshot({ openFiles: [...texts.keys()] });
    try {
      for (const [file, text] of texts) {
        const proj = snap.getDefaultProjectForFile(file) ?? snap.getProjects()[0];
        const sf = proj?.program.getSourceFile(file);
        if (sf) measureOne(sf, { file, text, kinds, visitEachChild, functions });
      }
    } finally {
      snap.dispose();
    }
  } finally {
    api.close();
  }
  return { functions, files: rows };
}
