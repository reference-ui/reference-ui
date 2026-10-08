/**
 * Tokenize TypeScript theme files for the spec generator.
 * Skips whitespace and comments, keeps string / number / identifier / punct
 * tokens, and records 1-based line and column for fail-closed diagnostics.
 * Template literals with substitutions and unclosed strings are errors — this
 * scanner does not evaluate source.
 */

export type TokenKind = 'ident' | 'string' | 'number' | 'punct' | 'eof';

export type Token = {
  kind: TokenKind;
  value: string;
  line: number;
  col: number;
};

type Scan = {
  text: string;
  filePath: string;
  i: number;
  line: number;
  col: number;
};

export function tokenize(text: string, filePath: string): Token[] {
  const scan: Scan = { text, filePath, i: 0, line: 1, col: 1 };
  const tokens: Token[] = [];
  while (scan.i < scan.text.length) {
    if (skipTrivia(scan)) {
      continue;
    }
    tokens.push(nextToken(scan));
  }
  tokens.push({ kind: 'eof', value: '', line: scan.line, col: scan.col });
  return tokens;
}

export function tokenLoc(filePath: string, token: Token): string {
  return `${filePath}:${token.line}:${token.col}`;
}

function nextToken(scan: Scan): Token {
  const start = mark(scan);
  const ch = peek(scan);
  if (ch === '\'' || ch === '"' || ch === '`') {
    return takeString(scan, start, ch);
  }
  if (isDigit(ch)) {
    return takeWhile(scan, start, 'number', isDigit);
  }
  if (isIdentStart(ch)) {
    return takeWhile(scan, start, 'ident', isIdentPart);
  }
  if (isPunct(ch)) {
    bump(scan);
    return { kind: 'punct', value: ch, line: start.line, col: start.col };
  }
  failScan(scan, `unexpected ${JSON.stringify(ch)}`);
}

function skipTrivia(scan: Scan): boolean {
  const ch = peek(scan);
  if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
    bump(scan);
    return true;
  }
  if (ch === '/' && peekAt(scan, 1) === '/') {
    skipLineComment(scan);
    return true;
  }
  if (ch === '/' && peekAt(scan, 1) === '*') {
    skipBlockComment(scan);
    return true;
  }
  return false;
}

function skipLineComment(scan: Scan): void {
  while (scan.i < scan.text.length && peek(scan) !== '\n') {
    bump(scan);
  }
}

function skipBlockComment(scan: Scan): void {
  bump(scan);
  bump(scan);
  while (scan.i < scan.text.length) {
    if (peek(scan) === '*' && peekAt(scan, 1) === '/') {
      bump(scan);
      bump(scan);
      return;
    }
    bump(scan);
  }
  failScan(scan, 'unclosed block comment');
}

function takeString(scan: Scan, start: { line: number; col: number }, quote: string): Token {
  bump(scan);
  let value = '';
  let templateExpr = false;
  while (scan.i < scan.text.length) {
    const ch = peek(scan);
    if (ch === '\n') {
      failScan(scan, 'unclosed string');
    }
    if (ch === '\\') {
      bump(scan);
      value += takeEscape(scan);
      continue;
    }
    if (quote === '`' && ch === '$' && peekAt(scan, 1) === '{') {
      templateExpr = true;
    }
    if (ch === quote) {
      bump(scan);
      if (templateExpr) {
        failScan(scan, 'template substitutions are not allowed');
      }
      return { kind: 'string', value, line: start.line, col: start.col };
    }
    value += ch;
    bump(scan);
  }
  failScan(scan, 'unclosed string');
}

function takeEscape(scan: Scan): string {
  if (scan.i >= scan.text.length) {
    failScan(scan, 'unterminated escape');
  }
  const ch = peek(scan);
  bump(scan);
  return ch;
}

function takeWhile(
  scan: Scan,
  start: { line: number; col: number; i: number },
  kind: 'ident' | 'number',
  ok: (ch: string) => boolean,
): Token {
  while (scan.i < scan.text.length && ok(peek(scan))) {
    bump(scan);
  }
  return {
    kind,
    value: scan.text.slice(start.i, scan.i),
    line: start.line,
    col: start.col,
  };
}

function mark(scan: Scan): { line: number; col: number; i: number } {
  return { line: scan.line, col: scan.col, i: scan.i };
}

function peek(scan: Scan): string {
  return scan.text[scan.i] ?? '';
}

function peekAt(scan: Scan, offset: number): string {
  return scan.text[scan.i + offset] ?? '';
}

function bump(scan: Scan): void {
  if (scan.text[scan.i] === '\n') {
    scan.line += 1;
    scan.col = 1;
  } else {
    scan.col += 1;
  }
  scan.i += 1;
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

function isPunct(ch: string): boolean {
  return '(){}[]<>=,.:;+-*&|!?'.includes(ch);
}

function failScan(scan: Scan, message: string): never {
  throw new Error(`${scan.filePath}:${scan.line}:${scan.col}: ${message}`);
}
