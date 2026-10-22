//! Unit tests for the nesting gate.
//! They pin the limit and the line it reports, what the scan skips (strings, comments, template text), how TypeScript
//! generics count against plain JavaScript, that comparisons never accumulate depth, and the Oxc failure shape of a
//! refusal. A source within the bound must reach Oxc unchanged. Two measurements sit at the end: the pre-scan's
//! throughput on a synthetic corpus, and the deepest nesting over `SHARED_DEPTH_ROOTS`. Each runs only when
//! `SHARED_MEASURE_OUT` names a file, so a normal test run never pays for them.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

use oxc_allocator::Allocator;
use oxc_span::SourceType;

use super::{line_start, parse_bounded, refused_parser_return, scan_nesting, NestingRefusal, MAX_NESTING};

mod jsx;

fn ts() -> SourceType {
    SourceType::ts()
}

fn js() -> SourceType {
    SourceType::mjs()
}

#[test]
fn brackets_count_and_the_limit_is_inclusive() {
    assert_eq!(scan_nesting(&"(".repeat(MAX_NESTING), ts()), Ok(MAX_NESTING));
    assert_eq!(
        scan_nesting(&"(".repeat(MAX_NESTING + 1), ts()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 1
        })
    );
}

#[test]
fn refusal_names_the_line_where_the_limit_is_crossed() {
    let source = format!("\n\n{}", "[".repeat(MAX_NESTING + 1));
    assert_eq!(
        scan_nesting(&source, ts()),
        Err(NestingRefusal {
            depth: MAX_NESTING + 1,
            line: 3
        })
    );
}

#[test]
fn refusal_message_names_the_line_and_the_fix() {
    let refusal = NestingRefusal {
        depth: MAX_NESTING + 1,
        line: 7,
    };
    assert_eq!(
        refusal.message(),
        "nesting deeper than 1024 levels at line 7; split or flatten the deeply nested expression"
    );
}

#[test]
fn closed_brackets_release_depth_for_later_siblings() {
    let siblings = "f({ a: [1] }); ".repeat(MAX_NESTING * 4);
    assert_eq!(scan_nesting(&siblings, ts()), Ok(3));
}

#[test]
fn strings_comments_and_template_text_hide_their_brackets() {
    let hidden = "(".repeat(MAX_NESTING * 2);
    let source = format!(
        "const s = \"{hidden}\";\n// {hidden}\n/* {hidden} */\nconst t = `{hidden}`;\nconst u = 'x';\n"
    );
    assert_eq!(scan_nesting(&source, ts()), Ok(0));
}

#[test]
fn an_unterminated_string_stops_at_its_line() {
    let source = format!("const s = \"{}\nconst t = (1);\n", "(".repeat(MAX_NESTING * 2));
    assert_eq!(scan_nesting(&source, ts()), Ok(1));
}

#[test]
fn template_expressions_count_and_return_to_the_text() {
    assert_eq!(scan_nesting("`a${ (1) }b${ [2] }c`", ts()), Ok(2));
    let nested = format!("`{}", "${`".repeat(MAX_NESTING + 1));
    assert!(matches!(
        scan_nesting(&nested, ts()),
        Err(NestingRefusal { depth, .. }) if depth == MAX_NESTING + 1
    ));
}

#[test]
fn typescript_generics_nest_and_plain_javascript_does_not() {
    let generics = format!("let x: {}string{};", "Array<".repeat(MAX_NESTING + 1), ">".repeat(MAX_NESTING + 1));
    assert!(matches!(
        scan_nesting(&generics, ts()),
        Err(NestingRefusal { depth, .. }) if depth == MAX_NESTING + 1
    ));
    assert_eq!(scan_nesting(&generics, js()), Ok(0));
}

#[test]
fn comparisons_do_not_accumulate_depth() {
    assert_eq!(scan_nesting(&"a<b;".repeat(5000), ts()), Ok(1));
    assert_eq!(scan_nesting(&"if (a<b) f(c<d);\n".repeat(5000), ts()), Ok(2));
}

#[test]
fn arrows_inside_generics_close_cleanly() {
    let source = "let f: Array<() => void> = g;\n".repeat(3000);
    assert_eq!(scan_nesting(&source, ts()), Ok(2));
}

#[test]
fn a_refused_source_gives_oxc_failure_shape_with_no_program() {
    let allocator = Allocator::default();
    let parsed = refused_parser_return(&allocator, ts());
    assert!(parsed.panicked);
    assert!(parsed.program.body.is_empty());
    assert!(parsed.errors.is_empty());
}

#[test]
fn line_start_is_the_byte_after_the_previous_newline() {
    let source = "ab\ncd\n\nef";
    assert_eq!(line_start(source, 1), 0);
    assert_eq!(line_start(source, 2), 3);
    assert_eq!(line_start(source, 3), 6);
    assert_eq!(line_start(source, 4), 7);
}

#[test]
fn a_source_within_the_bound_reaches_oxc_unchanged() {
    let allocator = Allocator::default();
    let source = "const a = [1, 2, { b: (3) }];\nexport default a;\n";
    let parsed = parse_bounded(&allocator, source, ts()).expect("within the bound");
    assert!(parsed.errors.is_empty());
    assert_eq!(parsed.program.body.len(), 2);
}

/// Pre-scan throughput on a synthetic corpus of about 8 MB, as TypeScript and as TSX (which runs the JSX rules too). It
/// runs only when `SHARED_MEASURE_OUT` names a file, which receives one line per corpus with the rate:
/// `SHARED_MEASURE_OUT=<file> pnpm agentrs c shared --release measure_`.
#[test]
fn measure_throughput() {
    let Some(out) = std::env::var_os("SHARED_MEASURE_OUT") else { return };
    let block = "export function pick<T extends Record<string, number>>(input: T, keys: (keyof T)[]) {\n  return keys.map(key => ({ key, value: input[key] * (2 + 3) }))\n}\n// generated `template` ${value}\nconst text = 'a string with (brackets) inside';\n";
    let corpus = block.repeat(8_000_000 / block.len());
    let mut line = String::new();
    for (name, source_type) in [("ts", ts()), ("tsx", SourceType::tsx())] {
        let (rate, megabytes, ms) = measure_rate(&corpus, source_type);
        line.push_str(&format!(
            "pre-scan throughput ({name}): {rate:.0} MB/s over {megabytes:.1} MB ({ms:.2} ms per pass)\n"
        ));
    }
    append(&out, &line);
}

/// Scans `corpus` several times and returns the rate in MB/s, the corpus size in MB and the time per pass in ms.
fn measure_rate(corpus: &str, source_type: SourceType) -> (f64, f64, f64) {
    let rounds = 5;
    let started = Instant::now();
    for _ in 0..rounds {
        scan_nesting(corpus, source_type).expect("corpus stays within the bound");
    }
    let seconds = started.elapsed().as_secs_f64() / rounds as f64;
    let megabytes = corpus.len() as f64 / 1_000_000.0;
    (megabytes / seconds, megabytes, seconds * 1000.0)
}

/// Deepest nesting over every `.ts`, `.tsx`, `.d.ts`, `.js` and `.jsx` file under the colon-separated roots in
/// `SHARED_DEPTH_ROOTS`, appended to `SHARED_MEASURE_OUT`. It runs only when both variables are set.
#[test]
fn measure_repo_nesting() {
    let (Some(out), Ok(roots)) = (std::env::var_os("SHARED_MEASURE_OUT"), std::env::var("SHARED_DEPTH_ROOTS")) else {
        return;
    };
    let mut survey = Survey::default();
    for root in roots.split(':').map(Path::new) {
        visit(root, &mut |path| {
            if let Ok(raw) = fs::read(path) {
                survey.record(path, &raw);
            }
        });
    }
    append(&out, &survey.report());
}

/// What the repo-wide walk saw: how many files and bytes it scanned, the deepest real file, and each refused file.
#[derive(Default)]
struct Survey {
    files: usize,
    bytes: u64,
    deepest: (usize, PathBuf),
    refused: Vec<(NestingRefusal, PathBuf)>,
}

impl Survey {
    fn record(&mut self, path: &Path, raw: &[u8]) {
        self.files += 1;
        self.bytes += raw.len() as u64;
        let source = String::from_utf8_lossy(raw);
        let source_type = SourceType::from_path(path).unwrap_or_default();
        match scan_nesting(&source, source_type) {
            Ok(depth) if depth > self.deepest.0 => self.deepest = (depth, path.to_path_buf()),
            Ok(_) => {}
            Err(refusal) => self.refused.push((refusal, path.to_path_buf())),
        }
    }

    fn report(&self) -> String {
        let mut text = format!(
            "scanned {} files, {:.1} MB; deepest {} at {}; refused {}\n",
            self.files,
            self.bytes as f64 / 1_000_000.0,
            self.deepest.0,
            self.deepest.1.display(),
            self.refused.len()
        );
        for (refusal, path) in self.refused.iter().take(20) {
            text.push_str(&format!("refused: {} ({})\n", path.display(), refusal.message()));
        }
        text
    }
}

fn append(out: &std::ffi::OsStr, text: &str) {
    use std::io::Write;
    let mut file = fs::OpenOptions::new().create(true).append(true).open(out).expect("open SHARED_MEASURE_OUT");
    file.write_all(text.as_bytes()).expect("write SHARED_MEASURE_OUT");
}

/// Calls `each` for every scannable file under `dir`, skipping symlinks so a loop cannot run forever.
fn visit(dir: &Path, each: &mut dyn FnMut(&Path)) {
    let Ok(entries) = fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(kind) = entry.file_type() else { continue };
        if kind.is_symlink() {
            continue;
        }
        if kind.is_dir() {
            visit(&path, each);
        } else if is_scannable(&path) {
            each(&path);
        }
    }
}

fn is_scannable(path: &Path) -> bool {
    let name = path.to_string_lossy();
    [".ts", ".tsx", ".js", ".jsx"].iter().any(|ext| name.ends_with(ext))
}
