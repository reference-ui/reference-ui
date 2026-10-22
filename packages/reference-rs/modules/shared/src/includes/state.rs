//! Directory state for an include scope: what a symlink walk keys on instead of a path.
//! A `GlobState` holds the closed NFA positions of each alternative (positives, then negatives)
//! for each candidate form: the raw normalized path, and the root-relative path when the bound
//! root strips off. `root_state` starts at the root and `step` reads one directory name, so
//! equal states decide every file below them the same way, and that verdict equals
//! `matches_file` on the joined path.

use std::ffi::OsStr;
use std::path::Path;

use super::glob::Alternative;
use super::nfa::advance;
use super::{normalize_candidate, strip_borrowed, FileMatcher};

/// Form tag for the raw normalized path.
const RAW: u8 = 0;
/// Form tag for the path relative to the bound root.
const RELATIVE: u8 = 1;
/// Probe name joined under the root; dropping it leaves the directory prefix.
const PROBE: &str = "x";

/// Closed NFA positions per (form, alternative) after one directory prefix ending in `/`.
/// Entries are sorted and unique, and empty sets are never stored, so equal states mean equal verdicts.
#[derive(Clone, Debug, Default, PartialEq, Eq, Hash)]
pub(crate) struct GlobState {
    positions: Vec<(u8, u32, u32)>,
}

impl GlobState {
    /// Seal positions into canonical order, so equal states compare equal however they were built.
    fn from_positions(mut positions: Vec<(u8, u32, u32)>) -> Self {
        positions.sort_unstable();
        positions.dedup();
        Self { positions }
    }

    /// The closed positions held for one (form, alternative) pair.
    fn set(&self, form: u8, alt: usize) -> Vec<u32> {
        self.positions
            .iter()
            .filter(|(held_form, held_alt, _)| *held_form == form && *held_alt as usize == alt)
            .map(|&(_, _, token)| token)
            .collect()
    }
}

impl FileMatcher<'_> {
    /// Every alternative in state order: positives first, then negatives.
    fn alternatives(&self) -> impl Iterator<Item = &Alternative> + '_ {
        self.scope
            .positives
            .iter()
            .chain(self.scope.negatives.iter())
    }

    /// The state at `root`, the prefix every path under it starts with, for both candidate forms.
    /// `root` is the path this matcher was bound to, so the relative form strips that same root.
    pub(crate) fn root_state(&self, root: &Path) -> GlobState {
        if self.scope.is_open() {
            return GlobState::default();
        }
        let joined = normalize_candidate(&root.join(PROBE).to_string_lossy());
        let mut prefixes = vec![(RAW, drop_probe(&joined))];
        let relative = self
            .root
            .as_deref()
            .and_then(|bound| strip_borrowed(bound, &joined))
            .map(drop_probe);
        prefixes.extend(relative.map(|prefix| (RELATIVE, prefix)));
        self.start_state(&prefixes)
    }

    /// The state after one more directory name, which is read as `name/`.
    pub(crate) fn step(&self, state: &GlobState, name: &OsStr) -> GlobState {
        let text = format!("{}/", name_text(name));
        let mut positions = Vec::new();
        for (alt, tokens) in self.alternatives().enumerate() {
            for form in [RAW, RELATIVE] {
                let set = state.set(form, alt);
                if set.is_empty() {
                    continue;
                }
                for token in advance(tokens, &set, &text) {
                    positions.push((form, alt as u32, token));
                }
            }
        }
        GlobState::from_positions(positions)
    }

    /// Every (form, alternative) pair starts at its prefix; pairs that are already dead store nothing.
    fn start_state(&self, prefixes: &[(u8, &str)]) -> GlobState {
        let mut positions = Vec::new();
        for &(form, prefix) in prefixes {
            for (alt, tokens) in self.alternatives().enumerate() {
                for token in advance(tokens, &[0], prefix) {
                    positions.push((form, alt as u32, token));
                }
            }
        }
        GlobState::from_positions(positions)
    }
}

/// Drop the probe from a joined path, leaving the directory prefix: empty, or ending in `/`.
fn drop_probe(joined: &str) -> &str {
    joined.strip_suffix(PROBE).unwrap_or(joined)
}

/// The text one name adds to a candidate path: lossy, with `\` read as `/` as normalization does.
fn name_text(name: &OsStr) -> String {
    name.to_string_lossy().replace('\\', "/")
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::super::nfa::accepts;
    use super::super::IncludeScope;
    use super::*;

    /// Root spellings a walk can bind a scope to.
    const ROOTS: [&str; 5] = ["", "/", "r", "./r", "r/"];
    /// Include lists: open, plain, negated, brace alternatives, and negation-only scopes.
    const INCLUDES: [&[&str]; 11] = [
        &[],
        &["**/*.ts"],
        &["src/**/*.ts", "!src/a/**"],
        &["{a,b}/**/x.ts"],
        &["a/**", "!a/b/**"],
        &["!a/**"],
        &["**/*.{ts,tsx}", "!**/skip/**"],
        &["src/*/x.ts", "src/**/*.mjs"],
        &["a/**/b", "!a/b/c"],
        &["{a,r}/**/*.ts", "!r/a/**"],
        &["r/**/x.ts", "!**/x.ts"],
    ];
    /// Names with a backslash read as two segments, as the candidate normalization does.
    const DIRS: [&str; 6] = ["a", "b", "r", "src", "skip", "a\\b"];
    const FILES: [&str; 6] = ["x.ts", "a.tsx", "b.mjs", "a", "skip.ts", "b\\x.ts"];

    /// Every directory chain up to `depth` names, the empty chain included.
    fn chains(depth: usize) -> Vec<Vec<&'static str>> {
        let mut all = vec![Vec::new()];
        let mut frontier: Vec<Vec<&'static str>> = vec![Vec::new()];
        for _ in 0..depth {
            let mut next = Vec::new();
            for chain in &frontier {
                for dir in DIRS {
                    let mut longer = chain.clone();
                    longer.push(dir);
                    next.push(longer);
                }
            }
            all.extend(next.iter().cloned());
            frontier = next;
        }
        all
    }

    /// The verdict a state gives a file: a positive hit on some form, and no negative hit on any.
    fn state_verdict(matcher: &FileMatcher<'_>, state: &GlobState, file: &str) -> bool {
        let text = name_text(OsStr::new(file));
        let positives = matcher.scope.positives.len();
        let mut positive = matcher.scope.positives.is_empty();
        let mut negative = false;
        for (alt, tokens) in matcher.alternatives().enumerate() {
            for form in [RAW, RELATIVE] {
                let set = state.set(form, alt);
                if !set.is_empty() && accepts(tokens, &advance(tokens, &set, &text)) {
                    if alt < positives {
                        positive = true;
                    } else {
                        negative = true;
                    }
                }
            }
        }
        positive && !negative
    }

    /// The state and the joined directory path after stepping from `root` through `chain`.
    fn descend(matcher: &FileMatcher<'_>, root: &str, chain: &[&str]) -> (GlobState, PathBuf) {
        let mut state = matcher.root_state(Path::new(root));
        let mut dir = PathBuf::from(root);
        for name in chain {
            state = matcher.step(&state, OsStr::new(name));
            dir.push(name);
        }
        (state, dir)
    }

    /// Asserts that the state verdict equals `matches_file` for each test file under `dir`.
    /// Returns how many files were included and how many excluded.
    fn check_files(
        include: &[&str],
        matcher: &FileMatcher<'_>,
        state: &GlobState,
        dir: &Path,
    ) -> (usize, usize) {
        let mut counts = (0, 0);
        for file in FILES {
            let path = dir.join(file).to_string_lossy().into_owned();
            let expected = matcher.matches_file(&path);
            let got = state_verdict(matcher, state, file);
            assert_eq!(got, expected, "include {include:?} path {path:?}");
            if expected {
                counts.0 += 1;
            } else {
                counts.1 += 1;
            }
        }
        counts
    }

    #[test]
    fn an_open_scope_keeps_no_state() {
        let scope = IncludeScope::compile(&[]);
        let matcher = scope.matcher(Some("r"));
        assert_eq!(matcher.root_state(Path::new("r")), GlobState::default());
        assert_eq!(matcher.step(&GlobState::default(), OsStr::new("a")), GlobState::default());
    }

    #[test]
    fn state_verdicts_equal_matches_file() {
        let chains = chains(3);
        let mut totals = (0, 0);
        for include in INCLUDES {
            let patterns: Vec<String> = include.iter().map(|pattern| pattern.to_string()).collect();
            let scope = IncludeScope::compile(&patterns);
            for root in ROOTS {
                let matcher = scope.matcher(Some(root));
                for chain in &chains {
                    let (state, dir) = descend(&matcher, root, chain);
                    let (included, excluded) = check_files(include, &matcher, &state, &dir);
                    totals = (totals.0 + included, totals.1 + excluded);
                }
            }
        }
        assert!(
            totals.0 > 0 && totals.1 > 0,
            "verdicts must cover both outcomes: {totals:?}"
        );
    }
}
