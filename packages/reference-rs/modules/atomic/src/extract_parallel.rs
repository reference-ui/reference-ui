//! Per-file style extract, serial or from a program the caller already holds.
//!
//! Small compiles collect each styling file's bindings once ([`styling_files`]),
//! which analysis reads before the caller walks each retained program with them.
//! The parallel phase parses on the worker that will walk the file and calls
//! [`extract_program`] with the resolved imports, so the tree never crosses a
//! thread. Shard outputs commit in input order through [`FileOut::commit`]. Pool threads come from `lanes::spawn_lane`, so each carries the large lane stack.

use oxc_ast::ast::Program;
use rustc_hash::{FxHashMap, FxHashSet};

use crate::extract::recipes::selection::{RecipeBinding, TentativeSelection};
use crate::extract::scope::{ImportLookup, ScopeChain};
use crate::extract::{collect_bindings_with_identity, harvest::Sink, identity::IdentityGraph};
use crate::extract::{resolver::ResolvedExport, Composed, ExtractBindings, ExtractConfig};
use crate::extract::{ExtractContext, ExtractSinks, JsxHosts, OwnedProps};
use crate::recipes::Recipe;
use crate::runtime::AuthoredDeclaration;
use crate::stream::SourceSlot;
use crate::{
    diagnostics::{DiagnosticFact, DiagnosticsSession},
    extract, styling_skip, BreakpointScale, Diagnostic, ParseSession, Want,
};

/// Owned extract products of one file, in walk order.
pub(crate) struct FileOut {
    wants: Vec<Want>,
    recipes: Vec<Recipe>,
    diagnostics: Vec<Diagnostic>,
    authored: Vec<AuthoredDeclaration>,
    sinks: Vec<Sink>,
    facts: Vec<DiagnosticFact>,
    recipe_bindings: Vec<RecipeBinding>,
    tentative: Vec<TentativeSelection>,
}

/// One styling file of the serial walk: its retained program plus the
/// bindings collected for it once, which analysis and extraction both read.
pub(crate) struct StylingFile<'p> {
    pub program: &'p Program<'p>,
    pub bindings: ExtractBindings,
}

/// Each source's styling file by index (`None` for every other source): the
/// identity walk runs once per file, before analysis, as it does on the lanes.
pub(crate) fn styling_files<'p>(
    sources: &[(String, String)],
    parsed: &'p [oxc_parser::ParserReturn<'p>],
    slots: &[SourceSlot],
    identity: &IdentityGraph<'_>,
) -> Vec<Option<StylingFile<'p>>> {
    sources
        .iter()
        .enumerate()
        .map(|(index, (path, content))| {
            let program = styling_program(slots, parsed, index, content)?;
            let bindings = collect_bindings_with_identity(program, path, identity);
            Some(StylingFile { program, bindings })
        })
        .collect()
}

/// Extract every styling file on the caller, in source order. Serial, used
/// for small compiles and as the one-thread behavior.
pub(crate) fn extract_all(
    session: &mut ParseSession<'_>,
    sources: &[(String, String)],
    files: &[Option<StylingFile<'_>>],
) {
    for ((path, content), file) in sources.iter().zip(files) {
        if let Some(file) = file {
            extract_parsed_program(session, path, content, file);
        }
    }
}

/// The retained program for a styling file: unpanicked, retained with its
/// parse, and not styling-free. `None` for any other index.
fn styling_program<'a>(
    slots: &[SourceSlot],
    parsed: &'a [oxc_parser::ParserReturn<'a>],
    index: usize,
    content: &str,
) -> Option<&'a Program<'a>> {
    let slot = &slots[index];
    if slot.panicked || slot.streamed || styling_skip(content) {
        return None;
    }
    Some(&parsed[slot.parsed?].program)
}

/// Walk one already-parsed program into the shared session, with the
/// bindings analysis already read for it.
fn extract_parsed_program(
    session: &mut ParseSession<'_>,
    path: &str,
    content: &str,
    file: &StylingFile<'_>,
) {
    let table = extract::scope::collect(file.program, session.constants);
    let values = session.resolver.resolve_file_imports(path, &table.import_refs());
    let lookup = ImportLookup::Binding {
        values: &values,
        fallback: session.constants,
    };
    let chain = ScopeChain::new(&table, lookup);
    let jsx_hosts = JsxHosts {
        local: file.bindings.jsx_hosts_ref(),
        global: session.traced_jsx,
    };
    let config = ExtractConfig {
        chain,
        breakpoints: session.breakpoints,
        bindings: &file.bindings,
        jsx_hosts,
        owned_props: session.hosts.owned_for(path),
        composed: session.composed,
        shadowed: &[],
    };
    let sinks = ExtractSinks {
        wants: session.wants,
        recipes: session.recipes,
        diagnostics: session.diagnostics,
        authored: session.authored,
        sinks: session.sinks,
        session: session.session,
        recipe_bindings: session.recipe_bindings,
        tentative: session.tentative,
    };
    let mut ctx = ExtractContext::new(path, Some(content), config, sinks);
    extract::extract_with_context(file.program, &mut ctx);
}

/// Split `len` items into strided shards, one per worker. Lane `k` owns
/// indices `k, k + workers, ...`, so adjacent heavy files spread across
/// lanes instead of straggling one contiguous range. Every caller commits
/// in input order, so the assignment balances work without moving output.
pub(crate) fn shard_strides(len: usize, workers: usize) -> Vec<Vec<usize>> {
    if workers == 0 {
        return Vec::new();
    }
    let mut shards: Vec<Vec<usize>> = (0..workers).map(|_| Vec::new()).collect();
    for index in 0..len {
        shards[index % workers].push(index);
    }
    shards.into_iter().filter(|shard| !shard.is_empty()).collect()
}

/// Cross-file answers the walk reads. The program stays on the parsing thread.
pub(crate) struct ExtractIn<'a> {
    pub path: &'a str,
    pub content: &'a str,
    pub constants: &'a extract::constants::LocalConstants,
    pub values: &'a FxHashMap<String, ResolvedExport>,
    pub bindings: &'a ExtractBindings,
    pub breakpoints: &'a BreakpointScale,
    pub traced: &'a FxHashSet<String>,
    pub owned_props: OwnedProps<'a>,
    pub composed: &'a Composed<'a>,
}

/// Walk one program the caller already parsed, into owned products.
pub(crate) fn extract_program(program: &Program<'_>, input: &ExtractIn<'_>) -> FileOut {
    let mut out = FileOut::empty();
    let table = extract::scope::collect(program, input.constants);
    let lookup = ImportLookup::Binding {
        values: input.values,
        fallback: input.constants,
    };
    let chain = ScopeChain::new(&table, lookup);
    let jsx_hosts = JsxHosts {
        local: input.bindings.jsx_hosts_ref(),
        global: input.traced,
    };
    let config = ExtractConfig {
        chain,
        breakpoints: input.breakpoints,
        bindings: input.bindings,
        jsx_hosts,
        owned_props: input.owned_props,
        composed: input.composed,
        shadowed: &[],
    };
    let mut facts = DiagnosticsSession::new();
    let sinks = ExtractSinks {
        wants: &mut out.wants,
        recipes: &mut out.recipes,
        diagnostics: &mut out.diagnostics,
        authored: &mut out.authored,
        sinks: &mut out.sinks,
        session: &mut facts,
        recipe_bindings: &mut out.recipe_bindings,
        tentative: &mut out.tentative,
    };
    let mut ctx = ExtractContext::new(input.path, Some(input.content), config, sinks);
    extract::extract_with_context(program, &mut ctx);
    out.facts = facts.take_facts();
    out
}

impl FileOut {
    /// An empty file result, filled by the walk.
    fn empty() -> Self {
        Self {
            wants: Vec::new(),
            recipes: Vec::new(),
            diagnostics: Vec::new(),
            authored: Vec::new(),
            sinks: Vec::new(),
            facts: Vec::new(),
            recipe_bindings: Vec::new(),
            tentative: Vec::new(),
        }
    }

    /// Append this file in the order the serial walk would have pushed.
    pub(crate) fn commit(self, sinks: &mut super::CompileSinks<'_>) {
        sinks.wants.extend(self.wants);
        sinks.recipes.extend(self.recipes);
        sinks.diagnostics.extend(self.diagnostics);
        sinks.authored.extend(self.authored);
        sinks.sinks.extend(self.sinks);
        sinks.session.extend_facts(self.facts);
        sinks.recipe_bindings.extend(self.recipe_bindings);
        sinks.tentative.extend(self.tentative);
    }
}

#[cfg(test)]
mod tests {
    use super::shard_strides;
    use crate::lanes::{entered_spawns, force_lane_count, hold_force_serial};
    use crate::{compile, CompileRequest, VirtualSource};

    /// Styling files importing one shared token, so the value graph runs.
    /// Each file holds `calls` six-prop `css()` calls.
    fn line_files(count: usize, calls: usize) -> CompileRequest {
        let mut files = vec![VirtualSource {
            path: "src/tokens.ts".into(),
            content: "export const gap = '4px';\n".into(),
        }];
        files.extend((0..count).map(|index| {
            let body = (0..calls)
                .map(|call| {
                    format!(
                        "export const c{index}_{call} = css({{ color: 'red', marginTop: gap, marginLeft: gap, paddingTop: gap, paddingLeft: gap, borderTopWidth: gap }});\n"
                    )
                })
                .collect::<String>();
            VirtualSource {
                path: format!("src/c{index}.ts"),
                content: format!(
                    "import {{ css }} from '@reference-ui/react';\nimport {{ gap }} from './tokens';\n{body}"
                ),
            }
        }));
        CompileRequest {
            files: Some(files),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            ..CompileRequest::default()
        }
    }

    /// Eight styling files under every threshold: the spawn-free product.
    fn eight_files() -> CompileRequest {
        line_files(8, 1)
    }

    /// Seventy styling files crossing the front (64) and tail (4k) thresholds.
    fn threshold_files() -> CompileRequest {
        line_files(70, 12)
    }

    #[test]
    fn tiny_compile_never_spawns() {
        let request = eight_files();
        let before = entered_spawns();
        let parallel = compile(&request).expect("tiny compile");
        assert_eq!(entered_spawns() - before, 0);
        let _hold = hold_force_serial();
        let serial = compile(&request).expect("serial compile");
        assert_eq!(parallel.stylesheet, serial.stylesheet);
        assert_eq!(parallel.portable_stylesheet, serial.portable_stylesheet);
        assert_eq!(parallel.atom_count, serial.atom_count);
        assert_eq!(parallel.diagnostics, serial.diagnostics);
    }

    #[test]
    fn lane_path_matches_serial_sheet() {
        let request = threshold_files();
        let before = entered_spawns();
        let parallel = compile(&request).expect("lane compile");
        let spawned = entered_spawns() - before;
        assert_eq!(spawned, 3, "front, want, and plan pools fire");
        let serial = {
            let _hold = hold_force_serial();
            compile(&request).expect("serial compile")
        };
        assert_eq!(entered_spawns() - before - spawned, 0);
        assert_eq!(parallel.stylesheet, serial.stylesheet);
        assert_eq!(parallel.portable_stylesheet, serial.portable_stylesheet);
        assert_eq!(parallel.atom_count, serial.atom_count);
        assert_eq!(parallel.diagnostics, serial.diagnostics);
    }

    /// Forced lanes match serial output across small file counts. All counts
    /// sit below the auto threshold, so the lane side pins four lanes while
    /// the serial side holds forced-serial (port of p0c's lane-count sweep).
    #[test]
    fn parallel_matches_serial_across_lane_counts() {
        for count in [1, 7, 8, 16] {
            let request = line_files(count, 1);
            force_lane_count(Some(4));
            let parallel = compile(&request).expect("parallel compile");
            force_lane_count(None);
            let serial = {
                let _hold = hold_force_serial();
                compile(&request).expect("serial compile")
            };
            assert_eq!(parallel.stylesheet, serial.stylesheet, "sheet for {count}");
            assert_eq!(parallel.diagnostics, serial.diagnostics, "diags for {count}");
        }
    }

    /// Strided shards cover every index exactly once, lane `k` holding
    /// `k, k + workers, ...`, with no overlap, gap, or empty lane.
    #[test]
    fn shard_strides_cover_edges() {
        for (len, workers) in [(0, 1), (1, 1), (7, 4), (8, 4), (9, 4), (16, 8)] {
            let shards = shard_strides(len, workers);
            let mut seen = vec![false; len];
            for (lane, shard) in shards.iter().enumerate() {
                assert!(!shard.is_empty());
                for &index in shard {
                    assert_eq!(index % workers, lane, "stride for {len}/{workers}");
                    assert!(!seen[index]);
                    seen[index] = true;
                }
            }
            assert!(seen.iter().all(|seen| *seen));
            assert_eq!(shards.len(), len.min(workers));
        }
    }

    /// Distinct slots fold concurrently without aliasing or deadlock.
    #[test]
    fn distinct_slots_fold_concurrently() {
        let slots: Vec<std::sync::Mutex<crate::phase_lane::OwnedFile>> = (0..8)
            .map(|_| std::sync::Mutex::new(crate::phase_lane::OwnedFile::blank()))
            .collect();
        std::thread::scope(|scope| {
            for slot in &slots {
                crate::lanes::spawn_lane(scope, || {
                    let mut file = crate::phase_lane::lock(slot);
                    file.errors.push(("probe".to_string(), None));
                });
            }
        });
        for slot in &slots {
            assert_eq!(crate::phase_lane::lock(slot).errors.len(), 1);
        }
    }
}
