//! Measurements for the nesting gate and the doubling check the linearity tests share. The measurements run only when
//! `SHARED_MEASURE_OUT` names a report file; `assert_linear` runs in the unit tests and times a scan at N and at 2N.
//! `measure_throughput` times the scan on a synthetic corpus of about 8 MB as TypeScript and as TSX, and on the adversarial
//! `(<a<)` that makes every `<` read ahead. `measure_repo_nesting` scans every source under `SHARED_DEPTH_ROOTS` twice, once
//! as its extension says and once with TypeScript forced on, which is how atomic and styletrace parse a `.js` file, and reports
//! the deepest counted nesting, the most constructs open at once, the raw bracket depth, and every refused file.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use oxc_span::SourceType;

use super::super::scan::{raw_peak, Scan};
use super::super::{check_nesting, scan_nesting, NestingRefusal};

fn ts() -> SourceType {
    SourceType::ts()
}

/// The slowest time one doubling may cost; linear work doubles, quadratic work quadruples.
const MAX_DOUBLING_RATIO: f64 = 3.0;

/// The hang guard: a scan that takes this long is stuck, whatever its ratio.
const HANG_CEILING: Duration = Duration::from_secs(60);

/// Proves a scan is linear in its input by doubling: it builds the source at `size` and at `2 * size`, runs `scan` on each
/// three times, and asserts that the fastest run at 2N is under three times the fastest run at N. Taking the minimum drops
/// the runs a loaded machine slowed, so the ratio does not depend on how fast the machine is.
pub(super) fn assert_linear(
    what: &str,
    size: usize,
    build: impl Fn(usize) -> String,
    scan: impl Fn(&str),
) {
    let fastest = |size: usize| {
        let source = build(size);
        (0..3)
            .map(|_| {
                let started = Instant::now();
                scan(&source);
                let took = started.elapsed();
                assert!(
                    took < HANG_CEILING,
                    "{what}: one scan at {size} took {took:?}"
                );
                took
            })
            .min()
            .expect("three runs")
    };
    let (single, double) = (fastest(size), fastest(size * 2));
    let ratio = double.as_secs_f64() / single.as_secs_f64();
    assert!(
        ratio < MAX_DOUBLING_RATIO,
        "{what}: doubling {size} took {single:?} then {double:?}, a ratio of {ratio:.2}"
    );
}

/// Scan throughput on a synthetic corpus of about 8 MB, as TypeScript and as TSX (which runs the JSX rules too), and the time
/// of the adversarial `(<a<)` in TSX. It writes one line per measurement to `SHARED_MEASURE_OUT`:
/// `SHARED_MEASURE_OUT=<file> pnpm agentrs c shared --release measure_`.
#[test]
fn measure_throughput() {
    let Some(out) = std::env::var_os("SHARED_MEASURE_OUT") else {
        return;
    };
    let block = "export function pick<T extends Record<string, number>>(input: T, keys: (keyof T)[]) {\n  return keys.map(key => ({ key, value: input[key] * (2 + 3) }))\n}\n// generated `template` ${value}\nconst text = 'a string with (brackets) inside';\n";
    let corpus = block.repeat(8_000_000 / block.len());
    let mut report = String::new();
    for (name, source_type) in [("ts", ts()), ("tsx", SourceType::tsx())] {
        report.push_str(&rate_line(
            &format!("pre-scan throughput ({name})"),
            &corpus,
            source_type,
        ));
    }
    let adversarial = "(<a<)".repeat(8_000_000 / 5);
    report.push_str(&rate_line(
        "adversarial (<a<) (tsx)",
        &adversarial,
        SourceType::tsx(),
    ));
    append(&out, &report);
}

fn rate_line(label: &str, corpus: &str, source_type: SourceType) -> String {
    let rounds = 5;
    let started = Instant::now();
    for _ in 0..rounds {
        scan_nesting(corpus, source_type).expect("corpus stays within the bound");
    }
    let seconds = started.elapsed().as_secs_f64() / rounds as f64;
    let megabytes = corpus.len() as f64 / 1_000_000.0;
    format!(
        "{label}: {:.0} MB/s over {megabytes:.1} MB ({:.2} ms per pass)\n",
        megabytes / seconds,
        seconds * 1000.0
    )
}

/// Deepest nesting over every source under the colon-separated roots in `SHARED_DEPTH_ROOTS`, appended to
/// `SHARED_MEASURE_OUT`. It runs only when both variables are set.
#[test]
fn measure_repo_nesting() {
    let (Some(out), Ok(roots)) = (
        std::env::var_os("SHARED_MEASURE_OUT"),
        std::env::var("SHARED_DEPTH_ROOTS"),
    ) else {
        return;
    };
    let mut natural = Survey::new("as the extension says", false);
    let mut forced = Survey::new("TypeScript forced", true);
    for root in roots.split(':').map(Path::new) {
        visit(root, &mut |path| {
            if let Ok(raw) = fs::read(path) {
                let source = String::from_utf8_lossy(&raw);
                natural.record(path, &source);
                forced.record(path, &source);
            }
        });
    }
    append(&out, &(natural.report() + &forced.report()));
}

/// How many files a survey lists for each of its measures.
const LISTED: usize = 6;

/// The files with the largest value of one measure, largest first.
#[derive(Default)]
struct Marks(Vec<(usize, PathBuf)>);

impl Marks {
    fn raise(&mut self, value: usize, path: &Path) {
        if self.0.len() == LISTED && value <= self.0[LISTED - 1].0 {
            return;
        }
        self.0.push((value, path.to_path_buf()));
        self.0.sort_by(|a, b| b.0.cmp(&a.0));
        self.0.truncate(LISTED);
    }

    fn show(&self, name: &str) -> String {
        let mut text = String::new();
        for (value, path) in &self.0 {
            text.push_str(&format!("  {name} {value}: {}\n", path.display()));
        }
        text
    }
}

/// What one survey pass saw: the files and bytes it scanned, the largest depth, open count and raw depth, each refused file,
/// and how long the full scan and the gate's own check (with its opener count in front) took over all of them.
struct Survey {
    label: &'static str,
    typescript: bool,
    files: usize,
    bytes: u64,
    skipped: (usize, u64),
    deepest: Marks,
    open: Marks,
    raw: Marks,
    refused: Vec<(NestingRefusal, PathBuf)>,
    timing: (Duration, Duration),
}

impl Survey {
    fn new(label: &'static str, typescript: bool) -> Self {
        Self {
            label,
            typescript,
            files: 0,
            bytes: 0,
            skipped: (0, 0),
            deepest: Marks::default(),
            open: Marks::default(),
            raw: Marks::default(),
            refused: Vec::new(),
            timing: (Duration::ZERO, Duration::ZERO),
        }
    }

    fn record(&mut self, path: &Path, source: &str) {
        self.files += 1;
        self.bytes += source.len() as u64;
        let mut source_type = SourceType::from_path(path).unwrap_or_default();
        if self.typescript {
            source_type = source_type.with_typescript(true);
        }
        let started = Instant::now();
        let verdict = scan_nesting(source, source_type);
        let scanned = started.elapsed();
        let started = Instant::now();
        let checked = check_nesting(source, source_type);
        self.timing = (self.timing.0 + scanned, self.timing.1 + started.elapsed());
        assert_eq!(
            verdict.map(|_| ()),
            checked,
            "the check and the scan agree on {}",
            path.display()
        );
        let mut scan = Scan::new(
            source.as_bytes(),
            source_type.is_typescript(),
            source_type.is_jsx(),
        );
        match scan.run() {
            Ok(depth) => self.deepest.raise(depth, path),
            Err(refusal) => self.refused.push((refusal, path.to_path_buf())),
        }
        self.open.raise(scan.peak_open(), path);
        self.raw.raise(raw_peak(source.as_bytes()), path);
        if !super::super::scan::can_refuse(source.as_bytes()) {
            self.skipped = (self.skipped.0 + 1, self.skipped.1 + source.len() as u64);
        }
    }

    fn report(&self) -> String {
        let megabytes = self.bytes as f64 / 1_000_000.0;
        let rate = |time: Duration| megabytes / time.as_secs_f64();
        let mut text = format!(
            "[{}] scanned {} files, {:.1} MB; refused {}\n",
            self.label,
            self.files,
            megabytes,
            self.refused.len()
        );
        text.push_str(&self.deepest.show("deepest"));
        text.push_str(&self.open.show("most open"));
        text.push_str(&self.raw.show("raw depth"));
        text.push_str(&format!(
            "[{}] full scan {:.0} MB/s, check {:.0} MB/s; the opener count skipped {} files and {:.1} MB\n",
            self.label,
            rate(self.timing.0),
            rate(self.timing.1),
            self.skipped.0,
            self.skipped.1 as f64 / 1_000_000.0
        ));
        for (refusal, path) in self.refused.iter().take(20) {
            text.push_str(&format!(
                "refused: {} ({})\n",
                path.display(),
                refusal.message()
            ));
        }
        text
    }
}

fn append(out: &std::ffi::OsStr, text: &str) {
    use std::io::Write;
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(out)
        .expect("open SHARED_MEASURE_OUT");
    file.write_all(text.as_bytes())
        .expect("write SHARED_MEASURE_OUT");
}

/// Calls `each` for every scannable file under `dir`, skipping symlinks so a loop cannot run forever.
fn visit(dir: &Path, each: &mut dyn FnMut(&Path)) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(kind) = entry.file_type() else {
            continue;
        };
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
    [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"]
        .iter()
        .any(|ext| name.ends_with(ext))
}
