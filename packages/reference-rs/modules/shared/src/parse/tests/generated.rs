//! Generated nests of known depth, scanned against the depth the generator built.
//! Each source mixes brackets, template expressions, closed generics and JSX elements with the noise a lexer must read past
//! (strings, comments, regex literals, comparisons, divisions, JSX text), and the scan must report exactly the nesting the
//! generator built. A second group chains one kind of construct, or a cycle of them, to the limit and one past it. The
//! generator is a fixed-seed xorshift, so a failure names its case and repeats.

use super::super::{scan_nesting, NestingRefusal, MAX_NESTING};
use oxc_span::SourceType;

struct Rng(u64);

impl Rng {
    fn below(&mut self, bound: usize) -> usize {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        (self.0 % bound as u64) as usize
    }
}

/// A piece of source and the deepest nesting it holds.
struct Piece {
    text: String,
    depth: usize,
}

const NOISE: [&str; 12] = [
    "\"(((\"",
    "')]}'",
    "/* ( [ { */",
    "/[(\"']/",
    "`x(`",
    "a < b",
    "n<10",
    "a<<b",
    "1 / 2",
    "x",
    "\"</div>\"",
    "1 + 2",
];

const TEXT: [&str; 6] = [
    "it's (open",
    "say \"hi\" [",
    "a /* b",
    "see http://x",
    "&amp; ((",
    "plain",
];

fn noise(rng: &mut Rng) -> Piece {
    Piece {
        text: NOISE[rng.below(NOISE.len())].to_string(),
        depth: 0,
    }
}

/// Joins one to three pieces with commas and wraps them: the depth is one over the deepest.
fn wrap(rng: &mut Rng, tsx: bool, budget: usize, (open, close): (&str, &str)) -> Piece {
    let count = 1 + rng.below(3);
    let pieces: Vec<Piece> = (0..count).map(|_| code(rng, tsx, budget - 1)).collect();
    let text = pieces
        .iter()
        .map(|p| p.text.as_str())
        .collect::<Vec<_>>()
        .join(", ");
    let depth = pieces.iter().map(|p| p.depth).max().unwrap_or(0);
    Piece {
        text: format!("{open}{text}{close}"),
        depth: depth + 1,
    }
}

/// A type: closed generics around a plain name, a tuple or a type literal.
fn ty(rng: &mut Rng, budget: usize) -> Piece {
    if budget == 0 {
        return Piece {
            text: "string".into(),
            depth: 0,
        };
    }
    let inner = ty(rng, budget - 1);
    let (open, close) = [
        ("Array<", ">"),
        ("Map<string, ", ">"),
        ("[", ", number]"),
        ("{ k: ", " }"),
    ][rng.below(4)];
    Piece {
        text: format!("{open}{}{close}", inner.text),
        depth: inner.depth + 1,
    }
}

fn element(rng: &mut Rng, budget: usize) -> Piece {
    let name = ["div", "p", "A.b", "my-el"][rng.below(4)];
    let kids = 1 + rng.below(3);
    let mut text = format!("<{name} t=\"x(\">");
    let mut depth = 0;
    for _ in 0..kids {
        match rng.below(3) {
            0 => text.push_str(TEXT[rng.below(TEXT.len())]),
            1 if budget > 0 => {
                let child = element(rng, budget - 1);
                text.push_str(&child.text);
                depth = depth.max(child.depth);
            }
            _ => {
                let child = code(rng, true, budget.saturating_sub(1));
                text.push_str(&format!("{{{}}}", child.text));
                depth = depth.max(child.depth + 1);
            }
        }
    }
    text.push_str(&format!("</{name}>"));
    Piece {
        text,
        depth: depth + 1,
    }
}

fn code(rng: &mut Rng, tsx: bool, budget: usize) -> Piece {
    if budget == 0 {
        return noise(rng);
    }
    match rng.below(if tsx { 9 } else { 7 }) {
        0 => wrap(rng, tsx, budget, ("(", ")")),
        1 => wrap(rng, tsx, budget, ("[", "]")),
        2 => {
            let inner = code(rng, tsx, budget - 1);
            Piece {
                text: format!("{{ a: {} }}", inner.text),
                depth: inner.depth + 1,
            }
        }
        3 => {
            let inner = code(rng, tsx, budget - 1);
            Piece {
                text: format!("`t(${{{}}})`", inner.text),
                depth: inner.depth + 1,
            }
        }
        4 => {
            let (kind, arg) = (ty(rng, budget.min(4)), code(rng, tsx, budget - 1));
            Piece {
                text: format!("f<{}>({})", kind.text, arg.text),
                depth: (kind.depth + 1).max(arg.depth + 1),
            }
        }
        5 | 6 => noise(rng),
        _ => element(rng, budget - 1),
    }
}

/// Generic function types and call signatures, which TSX first reads as elements. The scan reads that text again as code once
/// a `>` or `}` shows it was never an element, so the interface is two levels deep in TypeScript and in TSX.
const SIGNATURES: &str = "type G = <T>(x: T) => T;\ninterface I { <U>(y: U): U }\n";

/// Whole statements that read a slash one way or the other, with the depth each holds. A regex after the head of an `if`, a
/// division after an object literal and a name that is also a keyword all sit beside the nests, and a slash read the wrong way
/// would let a quote in a regex swallow the lines after it.
const SLASH_STATEMENTS: [(&str, usize); 6] = [
    ("if (x) /\"/.test(s);\n", 1),
    ("while (y) /'/g.test(s);\n", 1),
    ("x = {} / 2 / 3;\n", 1),
    ("let of = 1; z = of / 2 / 4;\n", 0),
    ("function f() {}\n/[\"']/.test(s);\n", 1),
    ("a = b\n/ 2 / c;\n", 0),
];

fn source(rng: &mut Rng, tsx: bool) -> Piece {
    let mut text = String::new();
    let mut depth = 0;
    for _ in 0..1 + rng.below(4) {
        if rng.below(3) == 0 {
            text.push_str(SIGNATURES);
            depth = depth.max(2);
        }
        if rng.below(2) == 0 {
            let (statement, held) = SLASH_STATEMENTS[rng.below(SLASH_STATEMENTS.len())];
            text.push_str(statement);
            depth = depth.max(held);
        }
        let budget = 2 + rng.below(9);
        let piece = code(rng, tsx, budget);
        text.push_str(&format!("x = {};\n", piece.text));
        depth = depth.max(piece.depth);
    }
    Piece { text, depth }
}

#[test]
fn generated_nests_report_the_depth_the_generator_built() {
    for (tsx, source_type) in [(false, SourceType::ts()), (true, SourceType::tsx())] {
        let mut rng = Rng(0x9E37_79B9_7F4A_7C15);
        for case in 0..3000 {
            let piece = source(&mut rng, tsx);
            assert_eq!(
                scan_nesting(&piece.text, source_type),
                Ok(piece.depth),
                "case {case} (tsx {tsx}):\n{}",
                piece.text
            );
        }
    }
}

/// One link of a chain: what opens it, what closes it, how many levels it adds, and whether it needs TSX. An element holds
/// code only in an expression container, so its link opens the container too.
const LINKS: [(&str, &str, usize, bool); 6] = [
    ("(", ")", 1, false),
    ("[", "]", 1, false),
    ("{ a: ", " }", 1, false),
    ("Array<", ">", 1, false),
    ("`${", "}`", 1, false),
    ("<div>{", "}</div>", 2, true),
];

/// A chain of exactly `depth` levels cycling through `cycle`; a link that would overshoot is replaced by a parenthesis.
fn chain(depth: usize, cycle: &[usize]) -> String {
    let (mut opens, mut closes) = (String::new(), Vec::new());
    let (mut left, mut at) = (depth, 0);
    while left > 0 {
        let (open, close, weight, _) = LINKS[cycle[at % cycle.len()]];
        let (open, close, weight) = if weight <= left {
            (open, close, weight)
        } else {
            ("(", ")", 1)
        };
        opens.push_str(open);
        closes.push(close);
        left -= weight;
        at += 1;
    }
    let closes: String = closes.into_iter().rev().collect();
    format!("x = {opens}y{closes};\n")
}

#[test]
fn every_kind_of_chain_is_counted_to_the_limit_and_refused_one_past_it() {
    let cycles: [&[usize]; 9] = [
        &[0],
        &[1],
        &[2],
        &[3],
        &[4],
        &[5],
        &[0, 3, 1, 5],
        &[3, 4, 5, 2],
        &[5, 0, 5, 3, 1],
    ];
    for cycle in cycles {
        let source_type = if cycle.iter().any(|&at| LINKS[at].3) {
            SourceType::tsx()
        } else {
            SourceType::ts()
        };
        for depth in [1, MAX_NESTING - 1, MAX_NESTING] {
            assert_eq!(
                scan_nesting(&chain(depth, cycle), source_type),
                Ok(depth),
                "cycle {cycle:?} at {depth}"
            );
        }
        for depth in [MAX_NESTING + 1, 3000] {
            assert!(
                matches!(scan_nesting(&chain(depth, cycle), source_type), Err(NestingRefusal { depth: found, .. }) if found == MAX_NESTING + 1),
                "cycle {cycle:?} at {depth}"
            );
        }
    }
}
