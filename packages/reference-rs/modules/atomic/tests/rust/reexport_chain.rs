//! Compile time grows linearly with a chain of same-name re-exports, rooted on disk.
//! A named chain (`export { v } from './f1'`) and a star chain (`export * from './f1'`) end in a file that exports the value
//! a styled app file reads. For each shape the compile runs three times at N files and at 2N files, and the fastest run at 2N
//! must be under three times the fastest at N, the rule `shared`'s linearity tests use. Each compile must emit the class the
//! chain's value styles. Declared re-exports are skipped when their source is walked on its own, so the named chain costs one
//! hop per file instead of a walk to the end of the chain.

use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use atomic::{BaseSystem, CompileRequest};

/// Files in the smaller chain; the larger holds twice as many.
const CHAIN_FILES: usize = 1_000;
/// The slowest time one doubling may cost; linear work doubles, quadratic work quadruples.
const MAX_DOUBLING_RATIO: f64 = 3.0;
/// Stack for the compile thread: the trace recurses once per hop of the chain.
const STACK_BYTES: usize = 512 * 1024 * 1024;
/// The hang guard: a compile that takes this long is stuck, whatever its ratio.
const HANG_CEILING: Duration = Duration::from_secs(120);

/// How each file in the chain reaches the next.
#[derive(Clone, Copy)]
enum Link {
    Named,
    Star,
}

impl Link {
    fn statement(self, next: usize) -> String {
        match self {
            Self::Named => format!("export {{ v }} from './f{next}'\n"),
            Self::Star => format!("export * from './f{next}'\n"),
        }
    }
}

/// A scratch project directory, removed on drop.
struct Project {
    root: PathBuf,
}

impl Project {
    fn new(name: &str) -> Self {
        // Import resolution canonicalizes, and the trace pairs a resolved path with an entry by equality, so the root is canonical too.
        let base = std::fs::canonicalize(std::env::temp_dir()).expect("canonical temp dir");
        let root = base.join(format!(
            "atomic-reexport-chain-{name}-{}",
            std::process::id()
        ));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("src")).expect("create project");
        Self { root }
    }

    fn write(&self, rel: &str, content: &str) {
        std::fs::write(self.root.join(rel), content).expect("write file");
    }
}

impl Drop for Project {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.root);
    }
}

/// A chain of `files` modules: `f0` through `f{files - 1}`, the last exporting `v`, and an app that styles with it.
fn chain_project(name: &str, link: Link, files: usize) -> Project {
    let project = Project::new(name);
    for index in 0..files - 1 {
        project.write(&format!("src/f{index}.ts"), &link.statement(index + 1));
    }
    project.write(
        &format!("src/f{}.ts", files - 1),
        "export const v = 'red'\n",
    );
    project.write(
        "src/app.ts",
        "import { css } from '@reference-ui/react'\nimport { v } from './f0'\nexport const a = css({ color: v })\n",
    );
    project
}

/// One rooted compile: its duration, asserting the app's class is emitted.
fn compile_once(root: &Path) -> Duration {
    let base_system = BaseSystem::lib_fixture().clone();
    let started = Instant::now();
    let result = atomic::compile(&CompileRequest {
        root_dir: Some(root.to_string_lossy().into_owned()),
        base_system,
        logs: Some(vec!["proof".to_string()]),
        ..CompileRequest::default()
    })
    .expect("compile succeeds");
    let took = started.elapsed();
    let classes: Vec<&String> = result
        .css
        .as_ref()
        .map_or_else(Vec::new, |css| css.classes.keys().collect());
    assert!(
        classes.iter().any(|key| key.as_str() == "color:red"),
        "color:red missing; emitted {classes:?}"
    );
    assert!(
        took < HANG_CEILING,
        "one compile of {} took {took:?}",
        root.display()
    );
    took
}

/// The fastest of three compiles of a chain of `files` modules.
fn fastest(name: &str, link: Link, files: usize) -> Duration {
    let project = chain_project(name, link, files);
    (0..3)
        .map(|_| compile_once(&project.root))
        .min()
        .expect("three runs")
}

/// Runs `body` on a thread with room for the walk's recursion: a debug build spends far more stack per hop than a release one.
fn on_deep_stack(body: impl FnOnce() + Send + 'static) {
    std::thread::Builder::new()
        .stack_size(STACK_BYTES)
        .spawn(body)
        .expect("spawn")
        .join()
        .unwrap_or_else(|panic| std::panic::resume_unwind(panic));
}

fn assert_linear(name: &'static str, link: Link) {
    on_deep_stack(move || measure_doubling(name, link));
}

fn measure_doubling(name: &str, link: Link) {
    let (single, double) = (
        fastest(name, link, CHAIN_FILES),
        fastest(name, link, CHAIN_FILES * 2),
    );
    let ratio = double.as_secs_f64() / single.as_secs_f64();
    assert!(
        ratio < MAX_DOUBLING_RATIO,
        "{name}: doubling {CHAIN_FILES} files took {single:?} then {double:?}, a ratio of {ratio:.2}"
    );
}

#[test]
fn a_named_re_export_chain_compiles_in_linear_time() {
    assert_linear("named", Link::Named);
}

#[test]
fn a_star_re_export_chain_compiles_in_linear_time() {
    assert_linear("star", Link::Star);
}
