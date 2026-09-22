//! Include-glob scoping for atomic source discovery (RS-10, station ATM-SCAN-01).
//! Compiles the frozen request's `include` patterns once so the disk scan and the
//! legacy virtual `files` list honor one scope. Patterns follow fast-glob flavor:
//! `**` crosses directories, `*` and `?` stay inside a segment, `{a,b}` braces
//! expand, `[...]` classes match one character, and a leading `!` negates.
//! An absent or empty include list leaves the scope open, preserving scan-all.
//! A negation-only list scopes to scan-all-minus-negatives (never open).

mod braces;
mod glob;

/// Compiled include scope: positive alternatives with negative overrides.
pub struct IncludeScope {
    positives: Vec<glob::Alternative>,
    negatives: Vec<glob::Alternative>,
}

impl IncludeScope {
    /// Compile include patterns; irregular fragments stay literal, never panic.
    pub fn compile(patterns: &[String]) -> Self {
        let mut positives = Vec::new();
        let mut negatives = Vec::new();
        for pattern in patterns {
            let (negated, body) = split_negation(pattern);
            let target = if negated {
                &mut negatives
            } else {
                &mut positives
            };
            for expanded in braces::expand(body) {
                target.push(glob::parse(&normalize_pattern(&expanded)));
            }
        }
        Self {
            positives,
            negatives,
        }
    }

    /// True when no pattern of either sign exists, so every file stays in scope.
    pub fn is_open(&self) -> bool {
        self.positives.is_empty() && self.negatives.is_empty()
    }

    /// Match one normalized candidate path against the whole scope.
    pub fn matches(&self, candidate: &str) -> bool {
        if self.is_open() {
            return true;
        }
        (self.positives.is_empty() || self.matches_positive(candidate))
            && !self.matches_negative(candidate)
    }

    /// Match a source file, trying its root-relative form before the raw path.
    pub fn matches_file(&self, root: Option<&str>, path: &str) -> bool {
        self.matcher(root).matches_file(path)
    }

    /// Bind this scope to one root for a file walk: the root normalizes
    /// once here instead of once per file. Match verdicts equal calling
    /// `matches_file` with the same root on every path.
    pub fn matcher(&self, root: Option<&str>) -> FileMatcher<'_> {
        FileMatcher {
            scope: self,
            root: root.map(normalize_candidate),
        }
    }

    fn matches_positive(&self, candidate: &str) -> bool {
        self.positives
            .iter()
            .any(|alternative| glob::matches(alternative, candidate))
    }

    fn matches_negative(&self, candidate: &str) -> bool {
        self.negatives
            .iter()
            .any(|alternative| glob::matches(alternative, candidate))
    }
}

/// Split a leading `!` negation; only the first mark negates, a second is literal.
fn split_negation(pattern: &str) -> (bool, &str) {
    match pattern.strip_prefix('!') {
        Some(rest) => (true, rest),
        None => (false, pattern),
    }
}

/// One scope bound to one pre-normalized root for a file walk.
/// Paths borrow through matching: clean paths never allocate, and the
/// root-relative form is a prefix strip, never a copy. Verdicts equal
/// the legacy per-file `matches_file` on every input.
pub struct FileMatcher<'a> {
    scope: &'a IncludeScope,
    root: Option<String>,
}

impl FileMatcher<'_> {
    /// Match a source file, trying its root-relative form before the raw path.
    pub fn matches_file(&self, path: &str) -> bool {
        if self.scope.is_open() {
            return true;
        }
        let owned;
        let normalized = match normalize_borrowed(path) {
            Ok(borrowed) => borrowed,
            Err(alloc) => {
                owned = alloc;
                owned.as_str()
            }
        };
        let relative = self
            .root
            .as_deref()
            .and_then(|root| strip_borrowed(root, normalized));
        let positive_hit = self.scope.positives.is_empty()
            || relative.is_some_and(|candidate| self.scope.matches_positive(candidate))
            || self.scope.matches_positive(normalized);
        positive_hit && !self.negative_hit(relative, normalized)
    }

    /// True when either candidate form trips a negative alternative.
    fn negative_hit(&self, relative: Option<&str>, normalized: &str) -> bool {
        relative.is_some_and(|candidate| self.scope.matches_negative(candidate))
            || self.scope.matches_negative(normalized)
    }
}

/// The normalized path, borrowed when already clean, owned otherwise.
/// The owned fallback runs the legacy normalization byte-for-byte.
fn normalize_borrowed(path: &str) -> Result<&str, String> {
    if is_normalized(path) {
        Ok(path)
    } else {
        Err(normalize_candidate(path))
    }
}

/// True when legacy normalization would return the input unchanged:
/// no backslashes, no `./` prefix, no trailing slash worth trimming.
fn is_normalized(path: &str) -> bool {
    !path.contains('\\') && !path.starts_with("./") && (path.len() <= 1 || !path.ends_with('/'))
}

/// Root-relative remainder of a normalized path, borrowed from the path.
/// A path equal to the root yields the empty form, exactly as before.
fn strip_borrowed<'a>(root: &str, path: &'a str) -> Option<&'a str> {
    if path == root {
        return Some("");
    }
    let tail = path.strip_prefix(root)?;
    tail.strip_prefix('/')
}

/// Normalize a candidate path: forward slashes, no `./` prefix or trailing `/`.
fn normalize_candidate(text: &str) -> String {
    trim_slashes(&text.replace('\\', "/"))
}

/// Normalize a pattern: patterns use `/`, so backslash keeps its escape role.
fn normalize_pattern(text: &str) -> String {
    trim_slashes(text)
}

fn trim_slashes(text: &str) -> String {
    let mut out = text.to_string();
    while let Some(rest) = out.strip_prefix("./") {
        out = rest.to_string();
    }
    while out.len() > 1 && out.ends_with('/') {
        out.pop();
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scope(patterns: &[&str]) -> IncludeScope {
        let owned: Vec<String> = patterns.iter().map(|pattern| pattern.to_string()).collect();
        IncludeScope::compile(&owned)
    }

    #[test]
    fn open_scope_matches_everything() {
        let open = scope(&[]);
        assert!(open.is_open());
        assert!(open.matches("theme/in.ts"));
        assert!(open.matches_file(Some("/root"), "/root/outside/out.ts"));
    }

    #[test]
    fn braces_expand_through_scope() {
        let scoped = scope(&["src/**/*.{ts,tsx}"]);
        assert!(scoped.matches("src/a.ts"));
        assert!(scoped.matches("src/deep/b.tsx"));
        assert!(!scoped.matches("src/deep/b.mjs"));
    }

    #[test]
    fn negation_carves_holes() {
        let scoped = scope(&["**/*.ts", "!outside/**"]);
        assert!(scoped.matches("theme/in.ts"));
        assert!(!scoped.matches("outside/out.ts"));
    }

    #[test]
    fn negation_only_excludes() {
        let scoped = scope(&["!outside/**"]);
        assert!(!scoped.is_open());
        assert!(scoped.matches("theme/in.ts"));
        assert!(!scoped.matches("outside/out.ts"));
        assert!(scoped.matches_file(Some("/root"), "/root/theme/in.ts"));
        assert!(!scoped.matches_file(Some("/root"), "/root/outside/out.ts"));
    }

    #[test]
    fn backslash_and_ragged_roots_match_forward_slashes() {
        let scoped = scope(&["src/**/*.ts"]);
        assert!(scoped.matches_file(Some("C:\\root"), "C:\\root\\src\\a.ts"));
        assert!(scoped.matches_file(Some("/root/"), "/root/src/a.ts"));
        assert!(scoped.matches_file(Some("./root"), "./root/src/a.ts"));
        assert!(!scoped.matches_file(Some("/root"), "/root/src/a.mjs"));
        assert!(!scoped.matches_file(Some("/other"), "/root/src/a.ts"));
    }

    #[test]
    fn files_resolve_relative_to_root() {
        let scoped = scope(&["theme/**"]);
        assert!(scoped.matches_file(Some("/root"), "/root/theme/in.ts"));
        assert!(!scoped.matches_file(Some("/root"), "/root/outside/out.ts"));
        assert!(scoped.matches_file(Some("/root"), "theme/in.ts"));
        assert!(!scoped.matches_file(Some("/root"), "outside/out.ts"));
        assert!(scope(&["/root/theme/**"]).matches_file(Some("/root"), "/root/theme/in.ts"));
    }

    fn scoped_request(include: Option<Vec<String>>) -> crate::CompileRequest {
        crate::CompileRequest {
            files: Some(vec![
                crate::VirtualSource {
                    path: "theme/in.ts".to_string(),
                    content: "import { css } from '@reference-ui/react'\n\
                        export const a = css({ color: 'red.500' })\n"
                        .to_string(),
                },
                crate::VirtualSource {
                    path: "outside/out.ts".to_string(),
                    content: "import { css } from '@reference-ui/react'\n\
                        export const b = css({ color: 'blue.500' })\n"
                        .to_string(),
                },
            ]),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            include,
            logs: Some(vec!["proof".to_string()]),
            ..crate::CompileRequest::default()
        }
    }

    fn has_color(wants: &[crate::Want], value: &str) -> bool {
        wants
            .iter()
            .any(|want| &*want.prop == "color" && want.value.to_string() == value)
    }

    #[test]
    fn include_scopes_virtual_files() {
        let scoped = crate::compile(&scoped_request(Some(vec!["theme/**".to_string()])))
            .expect("compile succeeds");
        assert!(has_color(&scoped.wants, "red.500"));
        assert!(!has_color(&scoped.wants, "blue.500"));
        assert!(scoped.diagnostics.is_empty());
    }

    #[test]
    fn open_include_keeps_legacy_files() {
        let all = crate::compile(&scoped_request(None)).expect("compile succeeds");
        assert!(has_color(&all.wants, "red.500"));
        assert!(has_color(&all.wants, "blue.500"));
        let empty = crate::compile(&scoped_request(Some(Vec::new()))).expect("compile succeeds");
        assert_eq!(empty.wants, all.wants);
        assert_eq!(empty.stylesheet, all.stylesheet);
    }

    #[test]
    fn include_scopes_disk_scan() {
        let root = std::env::temp_dir().join(format!("atomic_include_{}_scan", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("theme")).expect("create theme dir");
        std::fs::create_dir_all(root.join("outside")).expect("create outside dir");
        std::fs::write(
            root.join("theme/in.ts"),
            "import { css } from '@reference-ui/react'\nexport const a = css({ color: 'red.500' })\n",
        )
        .expect("write in.ts");
        std::fs::write(
            root.join("outside/out.ts"),
            "import { css } from '@reference-ui/react'\nexport const b = css({ color: 'blue.500' })\n",
        )
        .expect("write out.ts");

        let request = crate::CompileRequest {
            root_dir: Some(root.to_string_lossy().to_string()),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            include: Some(vec!["theme/**".to_string()]),
            logs: Some(vec!["proof".to_string()]),
            ..crate::CompileRequest::default()
        };
        let scoped = crate::compile(&request).expect("compile succeeds");
        assert!(has_color(&scoped.wants, "red.500"));
        assert!(!has_color(&scoped.wants, "blue.500"));
        assert!(scoped.diagnostics.is_empty());

        let _ = std::fs::remove_dir_all(&root);
    }
}
