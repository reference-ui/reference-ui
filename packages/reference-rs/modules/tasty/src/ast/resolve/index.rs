//! Top-level resolve orchestration: symbol index, export index, resolved graph.
//!
//! Builds the per-file export maps (explicit bindings seed first, then the
//! `export *` fold), resolves every symbol's references through those maps,
//! and assembles the final graph. Star-ambiguous names — one name from two
//! star targets with different symbol ids — are excluded from the barrel's
//! map with a single diagnostic (ESM absence), never first-wins.

use std::collections::{BTreeMap, BTreeSet};

use super::graph::ResolvedTypeScriptGraph;
use super::merge::fold_same_file_merges;
use super::resolver::{CrossFileValues, Resolver};
use crate::ast::model::{ParsedFileAst, ParsedTypeScriptAst};
use crate::diagnostics::{DiagnosticError, TastyDiagnostic};
use crate::model::{ExportMap, TsFile, TsSymbol};

pub(crate) fn resolve_ast(
    parsed_ast: ParsedTypeScriptAst,
) -> Result<ResolvedTypeScriptGraph, DiagnosticError> {
    let ParsedTypeScriptAst {
        files: mut parsed_files,
        mut diagnostics,
        bridged_libraries,
    } = parsed_ast;
    for parsed in parsed_files.iter_mut() {
        fold_same_file_merges(parsed, &mut diagnostics)?;
    }
    let symbol_index = build_symbol_index(&parsed_files);
    let mut reported_ambiguities = BTreeSet::new();
    let export_index = build_export_index(
        &parsed_files,
        &symbol_index,
        &mut diagnostics,
        &mut reported_ambiguities,
    )?;
    let cross_file_values = CrossFileValues::new(&parsed_files);
    let parsed_by_file_id = parsed_files
        .iter()
        .map(|parsed| (parsed.file_id.clone(), parsed))
        .collect::<BTreeMap<_, _>>();
    let mut export_cache = BTreeMap::<String, ExportMap>::new();
    let mut fold = ExportFold {
        parsed_by_file_id: &parsed_by_file_id,
        symbol_index: &symbol_index,
        cache: &mut export_cache,
        visited: BTreeSet::new(),
        sink: StarAmbiguitySink {
            diagnostics: &mut diagnostics,
            reported: &mut reported_ambiguities,
        },
    };
    let mut files = BTreeMap::new();
    let mut symbols = BTreeMap::new();
    let mut exports = BTreeMap::new();

    for parsed in parsed_files.iter().cloned() {
        let (file_id, module_specifier, ts_file, file_exports, resolved_symbols) =
            resolve_file(parsed, &export_index, &cross_file_values, &mut fold)?;

        files.insert(file_id, ts_file);
        symbols.extend(
            resolved_symbols
                .into_iter()
                .map(|symbol| (symbol.id.clone(), symbol)),
        );

        if !file_exports.is_empty() {
            exports.insert(module_specifier, file_exports);
        }
    }

    Ok(ResolvedTypeScriptGraph {
        files,
        symbols,
        exports,
        diagnostics,
        bridged_libraries,
    })
}

/// Fold context for building export maps: lookup tables, the per-pass map
/// cache, cycle-visit tracking, and the shared star-ambiguity sink.
struct ExportFold<'a> {
    parsed_by_file_id: &'a BTreeMap<String, &'a ParsedFileAst>,
    symbol_index: &'a BTreeMap<(String, String), String>,
    cache: &'a mut BTreeMap<String, ExportMap>,
    visited: BTreeSet<String>,
    sink: StarAmbiguitySink<'a>,
}

impl ExportFold<'_> {
    fn collect(&mut self, file_id: &str) -> Result<ExportMap, DiagnosticError> {
        if let Some(cached) = self.cache.get(file_id) {
            return Ok(cached.clone());
        }
        if !self.visited.insert(file_id.to_string()) {
            return Ok(BTreeMap::new());
        }
        let parsed_by_file_id = self.parsed_by_file_id;
        let Some(parsed) = parsed_by_file_id.get(file_id) else {
            self.visited.remove(file_id);
            return Ok(BTreeMap::new());
        };

        let mut exports = ExportMap::new();
        for (export_name, local_name) in &parsed.export_bindings {
            if let Some(symbol_id) = self.resolve_seed_symbol_id(parsed, local_name)? {
                exports.insert(export_name.clone(), symbol_id);
            }
        }

        self.fold_star_targets(file_id, parsed, &mut exports)?;

        self.visited.remove(file_id);
        self.cache.insert(file_id.to_string(), exports.clone());
        Ok(exports)
    }

    /// Resolve one explicit seed: the local shell first, else the remote
    /// name through the target's folded export map — transitive and
    /// default-aware, since the fold owns both. Remaining misses stay
    /// silent drops (unresolved-import shape); cycle misses stay silent
    /// since any diagnostic would fire on visit order, not the input.
    fn resolve_seed_symbol_id(
        &mut self,
        parsed: &ParsedFileAst,
        local_name: &str,
    ) -> Result<Option<String>, DiagnosticError> {
        if let Some(id) = self
            .symbol_index
            .get(&file_symbol_key(&parsed.file_id, local_name))
        {
            return Ok(Some(id.clone()));
        }
        let Some((target_file, remote_name)) = parsed.reexport_target.get(local_name) else {
            return Ok(None);
        };
        Ok(self.collect(target_file)?.get(remote_name).cloned())
    }

    /// Merge every `export *` target after the explicit seeds. ESM star
    /// never re-exports default, so star-provided `"default"` is skipped
    /// silently (absence, not ambiguity — no diagnostic); explicit
    /// `export { X as default }` seeds are already in the map and survive.
    fn fold_star_targets(
        &mut self,
        file_id: &str,
        parsed: &ParsedFileAst,
        exports: &mut ExportMap,
    ) -> Result<(), DiagnosticError> {
        let mut star_fold = StarFold::new(exports);
        for target_file_id in &parsed.export_all_targets {
            for (export_name, symbol_id) in self.collect(target_file_id)? {
                if export_name == "default" {
                    continue;
                }
                if let Some(conflict) = star_fold.merge(target_file_id, export_name, symbol_id) {
                    self.sink.report(file_id, &conflict, target_file_id)?;
                }
            }
        }
        Ok(())
    }
}

/// One barrel's `export *` fold over its explicit seeds: star names merge
/// until two targets disagree, at which point ESM absence wins and the
/// conflict is returned for a diagnostic.
struct StarFold<'a> {
    exports: &'a mut ExportMap,
    star_sources: BTreeMap<String, (String, String)>,
    ambiguous: BTreeSet<String>,
}

struct StarConflict {
    export_name: String,
    first_source: String,
}

impl<'a> StarFold<'a> {
    fn new(exports: &'a mut ExportMap) -> Self {
        Self {
            exports,
            star_sources: BTreeMap::new(),
            ambiguous: BTreeSet::new(),
        }
    }

    /// Merge one star-provided binding. Explicit seeds shadow stars, diamond
    /// same-id re-exports stay, and a second id for one name excludes the
    /// name and returns the conflict.
    fn merge(
        &mut self,
        target_file_id: &str,
        export_name: String,
        symbol_id: String,
    ) -> Option<StarConflict> {
        if self.ambiguous.contains(&export_name) || self.is_explicit_seed(&export_name) {
            return None;
        }
        match self.star_sources.get(&export_name).cloned() {
            Some((first_id, _)) if first_id == symbol_id => None,
            Some((_, first_source)) => Some(self.exclude_ambiguous(export_name, first_source)),
            None => {
                self.record_star_source(target_file_id, export_name, symbol_id);
                None
            }
        }
    }

    /// Explicit local and named-re-export bindings seed the map before the
    /// star fold, so a name already present from outside the fold shadows.
    fn is_explicit_seed(&self, export_name: &str) -> bool {
        self.exports.contains_key(export_name) && !self.star_sources.contains_key(export_name)
    }

    fn record_star_source(
        &mut self,
        target_file_id: &str,
        export_name: String,
        symbol_id: String,
    ) {
        self.star_sources.insert(
            export_name.clone(),
            (symbol_id.clone(), target_file_id.to_string()),
        );
        self.exports.insert(export_name, symbol_id);
    }

    fn exclude_ambiguous(&mut self, export_name: String, first_source: String) -> StarConflict {
        self.exports.remove(&export_name);
        self.star_sources.remove(&export_name);
        self.ambiguous.insert(export_name.clone());
        StarConflict {
            export_name,
            first_source,
        }
    }
}

/// Shared star-ambiguity diagnostic sink. The fold runs once per pass
/// (export index, then per-file exports), so reports dedupe by barrel and
/// name and exactly one diagnostic lands per conflict.
struct StarAmbiguitySink<'a> {
    diagnostics: &'a mut Vec<TastyDiagnostic>,
    reported: &'a mut BTreeSet<(String, String)>,
}

impl StarAmbiguitySink<'_> {
    fn report(
        &mut self,
        barrel_file_id: &str,
        conflict: &StarConflict,
        second_source: &str,
    ) -> Result<(), DiagnosticError> {
        if !self.reported.insert((
            barrel_file_id.to_string(),
            conflict.export_name.clone(),
        )) {
            return Ok(());
        }
        self.diagnostics.push(crate::diagnostics::star_ambiguity(
            barrel_file_id,
            &conflict.export_name,
            &conflict.first_source,
            second_source,
        )?);
        Ok(())
    }
}

fn file_symbol_key(file_id: &str, name: &str) -> (String, String) {
    (file_id.to_string(), name.to_string())
}

fn build_symbol_index(parsed_files: &[ParsedFileAst]) -> BTreeMap<(String, String), String> {
    parsed_files
        .iter()
        .flat_map(|parsed| {
            parsed.exports.iter().map(|symbol| {
                (
                    file_symbol_key(&parsed.file_id, &symbol.name),
                    symbol.id.clone(),
                )
            })
        })
        .collect()
}

fn build_export_index(
    parsed_files: &[ParsedFileAst],
    symbol_index: &BTreeMap<(String, String), String>,
    diagnostics: &mut Vec<TastyDiagnostic>,
    reported: &mut BTreeSet<(String, String)>,
) -> Result<BTreeMap<(String, String), String>, DiagnosticError> {
    let parsed_by_file_id = parsed_files
        .iter()
        .map(|parsed| (parsed.file_id.clone(), parsed))
        .collect::<BTreeMap<_, _>>();
    let mut cache = BTreeMap::<String, ExportMap>::new();
    let mut fold = ExportFold {
        parsed_by_file_id: &parsed_by_file_id,
        symbol_index,
        cache: &mut cache,
        visited: BTreeSet::new(),
        sink: StarAmbiguitySink {
            diagnostics,
            reported,
        },
    };

    let mut index = BTreeMap::new();
    for parsed in parsed_files {
        for (export_name, symbol_id) in fold.collect(&parsed.file_id)? {
            index.insert(
                file_symbol_key(&parsed.file_id, &export_name),
                symbol_id,
            );
        }
    }
    Ok(index)
}

fn resolve_file(
    parsed: ParsedFileAst,
    export_index: &BTreeMap<(String, String), String>,
    cross_file_values: &CrossFileValues,
    fold: &mut ExportFold<'_>,
) -> Result<(String, String, TsFile, ExportMap, Vec<TsSymbol>), DiagnosticError> {
    let ts_file = ts_file_from_parsed(&parsed);
    let file_exports = fold.collect(&parsed.file_id)?;
    let symbol_index = fold.symbol_index;
    let parsed_view = parsed.clone();
    let resolved_symbols = parsed
        .exports
        .into_iter()
        .map(|symbol| {
            Resolver::new(symbol_index, export_index, &parsed_view, cross_file_values)
                .resolve_symbol(symbol)
        })
        .collect();

    Ok((
        parsed.file_id.clone(),
        parsed.module_specifier.clone(),
        ts_file,
        file_exports,
        resolved_symbols,
    ))
}

fn ts_file_from_parsed(parsed: &ParsedFileAst) -> TsFile {
    TsFile {
        path: parsed.file_id.clone(),
        module_specifier: parsed.module_specifier.clone(),
        library: parsed.library.clone(),
    }
}
