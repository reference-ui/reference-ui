/**
 * Parse lib theme TypeScript object literals into JSON without evaluating them.
 * Tokenizes known `as const` files, resolves local identifiers and shorthand
 * properties, and fails closed on computed keys, spreads, calls, or any
 * expression that is not a string or nested object. Callers merge the six
 * `tokens()` arguments, the six `keyframes()` tables, and the `font()` family
 * table separately.
 */

import * as fs from 'node:fs';

import { tokenize, tokenLoc, type Token } from './scan';

export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = string | JsonObject;

type Parse = {
  filePath: string;
  tokens: Token[];
  i: number;
  locals: Map<string, JsonObject>;
};

export function parseTokensArguments(filePath: string): JsonObject[] {
  return walkFile(filePath, 'tokens').args;
}

export function parseKeyframesArguments(filePath: string): JsonObject[] {
  return walkFile(filePath, 'keyframes').args;
}

export function parseFontsObject(filePath: string): JsonObject {
  const fonts = walkFile(filePath, null).locals.get('fonts');
  if (!fonts) {
    fail(`${filePath} has no fonts object literal`);
  }
  return stripFontFace(fonts);
}

function walkFile(
  filePath: string,
  callName: string | null,
): { locals: Map<string, JsonObject>; args: JsonObject[] } {
  const text = fs.readFileSync(filePath, 'utf8');
  const p: Parse = {
    filePath,
    tokens: tokenize(text, filePath),
    i: 0,
    locals: new Map(),
  };
  const args: JsonObject[] = [];
  while (!check(p, 'eof')) {
    if (takeConst(p)) {
      continue;
    }
    if (callName !== null && takeNamedCall(p, callName, args)) {
      continue;
    }
    bump(p);
  }
  return { locals: p.locals, args };
}

function takeConst(p: Parse): boolean {
  const start = p.i;
  if (isIdent(p, 'export')) {
    bump(p);
  }
  if (!isIdent(p, 'const') || peek(p, 1)?.kind !== 'ident' || !isPunctAt(p, 2, '=')) {
    p.i = start;
    return false;
  }
  bump(p);
  const name = expectIdent(p);
  expectPunct(p, '=');
  const value = parseExpression(p);
  skipAsSatisfies(p);
  if (typeof value === 'string') {
    return true;
  }
  p.locals.set(name, value);
  return true;
}

function takeNamedCall(p: Parse, name: string, args: JsonObject[]): boolean {
  if (!isIdent(p, name) || !isPunctAt(p, 1, '(')) {
    return false;
  }
  const call = peek(p);
  bump(p);
  bump(p);
  const value = parseExpression(p);
  expectPunct(p, ')');
  args.push(asObject(value, p.filePath, call, name));
  return true;
}

function parseExpression(p: Parse): JsonValue {
  const token = peek(p);
  if (token.kind === 'string') {
    bump(p);
    return token.value;
  }
  if (isPunct(p, '{')) {
    return parseObject(p);
  }
  if (token.kind === 'ident') {
    return parseIdentValue(p);
  }
  fail(`unsupported ${describe(token)} at ${here(p)} — generator does not evaluate expressions`);
}

function parseIdentValue(p: Parse): JsonValue {
  const name = expectIdent(p);
  if (isPunct(p, '(')) {
    fail(`call expressions are not allowed at ${here(p)}`);
  }
  return resolveIdentifier(p, name);
}

function parseObject(p: Parse): JsonObject {
  expectPunct(p, '{');
  const out: JsonObject = {};
  while (!isPunct(p, '}')) {
    assignProperty(p, out);
    if (isPunct(p, ',')) {
      bump(p);
    }
  }
  expectPunct(p, '}');
  return out;
}

function assignProperty(p: Parse, out: JsonObject): void {
  rejectSpreadOrComputed(p);
  const keyToken = peek(p);
  const key = parseKey(p);
  if (Object.prototype.hasOwnProperty.call(out, key)) {
    fail(`duplicate key ${key} at ${tokenLoc(p.filePath, keyToken)}`);
  }
  out[key] = propertyValue(p, key);
}

function propertyValue(p: Parse, key: string): JsonValue {
  if (isPunct(p, ',') || isPunct(p, '}')) {
    return resolveIdentifier(p, key);
  }
  expectPunct(p, ':');
  return parseExpression(p);
}

function rejectSpreadOrComputed(p: Parse): void {
  if (isPunct(p, '.') && isPunctAt(p, 1, '.') && isPunctAt(p, 2, '.')) {
    fail(`spread is not allowed at ${here(p)}`);
  }
  if (isPunct(p, '[')) {
    fail(`computed key at ${here(p)} — generator does not evaluate keys`);
  }
}

function parseKey(p: Parse): string {
  const token = peek(p);
  if (token.kind === 'ident' || token.kind === 'string' || token.kind === 'number') {
    bump(p);
    return token.value;
  }
  fail(`unsupported property name at ${here(p)}`);
}

function skipAsSatisfies(p: Parse): void {
  while (isIdent(p, 'as') || isIdent(p, 'satisfies')) {
    bump(p);
    skipType(p);
  }
}

function skipType(p: Parse): void {
  if (peek(p).kind === 'ident' || peek(p).kind === 'string' || peek(p).kind === 'number') {
    bump(p);
    return;
  }
  fail(`unsupported type after as/satisfies at ${here(p)}`);
}

function resolveIdentifier(p: Parse, name: string): JsonValue {
  const obj = p.locals.get(name);
  if (!obj) {
    fail(
      `unresolved identifier ${name} in ${p.filePath} — generator does not evaluate modules`,
    );
  }
  return obj;
}

function asObject(
  value: JsonValue,
  filePath: string,
  token: Token,
  callName: string,
): JsonObject {
  if (typeof value === 'string') {
    fail(`${callName}() argument must be an object at ${tokenLoc(filePath, token)}`);
  }
  return value;
}

function stripFontFace(value: JsonObject): JsonObject {
  const out: JsonObject = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === 'fontFace') {
      continue;
    }
    out[key] = typeof child === 'string' ? child : stripFontFace(child);
  }
  return out;
}

function isIdent(p: Parse, value: string): boolean {
  const token = peek(p);
  return token.kind === 'ident' && token.value === value;
}

function isPunct(p: Parse, value: string): boolean {
  return isPunctAt(p, 0, value);
}

function isPunctAt(p: Parse, offset: number, value: string): boolean {
  const token = peek(p, offset);
  return token?.kind === 'punct' && token.value === value;
}

function expectIdent(p: Parse): string {
  const token = peek(p);
  if (token.kind !== 'ident') {
    fail(`expected identifier at ${here(p)}`);
  }
  bump(p);
  return token.value;
}

function expectPunct(p: Parse, value: string): void {
  if (!isPunct(p, value)) {
    fail(`expected ${value} at ${here(p)}`);
  }
  bump(p);
}

function peek(p: Parse, offset = 0): Token {
  return p.tokens[p.i + offset] ?? p.tokens[p.tokens.length - 1]!;
}

function bump(p: Parse): void {
  p.i += 1;
}

function check(p: Parse, kind: Token['kind']): boolean {
  return peek(p).kind === kind;
}

function describe(token: Token): string {
  return token.kind === 'punct' ? token.value : token.kind;
}

function here(p: Parse): string {
  return tokenLoc(p.filePath, peek(p));
}

export function fail(message: string): never {
  throw new Error(message);
}
