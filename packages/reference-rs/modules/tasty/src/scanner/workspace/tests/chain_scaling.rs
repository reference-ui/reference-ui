//! Scaling pin for the crawl: scanning a re-export chain must grow near linearly with its length.
//! The crawl once copied the set of discovered files for every file it visited, so doubling the chain more than doubled the
//! time. This test scans a 2,000-file and a 4,000-file chain, keeps the fastest of three runs each, and expects the larger
//! scan to cost under three times the smaller.

use std::time::{Duration, Instant};

use crate::scanner::scan_workspace;
use crate::tests::fixtures::TempDir;

const RUNS: usize = 3;

/// A chain of `length` user files, each re-exporting the next; the last exports a value.
fn write_chain(root: &TempDir, length: usize) {
    for index in 0..length {
        root.write(
            &format!("src/f{index}.ts"),
            &format!(
                "export {{ v }} from './f{}'\nexport type T{index} = {{ a: string }}\n",
                index + 1
            ),
        );
    }
    root.write(&format!("src/f{length}.ts"), "export const v = 'red'\n");
}

/// The fastest of `RUNS` scans of a fresh `length`-file chain.
fn fastest_scan(length: usize) -> Duration {
    let root = TempDir::new("scanner-chain-scaling");
    write_chain(&root, length);
    let include = vec!["src/**/*.ts".to_string()];
    (0..RUNS)
        .map(|_| {
            let started = Instant::now();
            let workspace = scan_workspace(root.path(), &include).expect("scan should succeed");
            let elapsed = started.elapsed();
            assert_eq!(workspace.files.len(), length + 1);
            elapsed
        })
        .min()
        .expect("at least one run")
}

#[test]
fn scanning_a_chain_twice_as_long_costs_under_three_times_as_much() {
    let small = fastest_scan(2_000);
    let large = fastest_scan(4_000);
    let ratio = large.as_secs_f64() / small.as_secs_f64();
    assert!(
        ratio < 3.0,
        "4,000 files took {large:?} against {small:?} for 2,000 files, a ratio of {ratio:.2}"
    );
}
