//! Top-level resolve orchestration: symbol index → export index → resolved graph.

use std::collections::{BTreeMap, BTreeSet};

use super::graph::ResolvedTypeScriptGraph;
use super::resolver::Resolver;
use crate::tasty::ast::model::{ParsedFileAst, ParsedTypeScriptAst, SymbolShell};
use crate::tasty::model::{ExportMap, TsFile, TsSymbol};

pub(crate) fn resolve_ast(parsed_ast: ParsedTypeScriptAst) -> ResolvedTypeScriptGraph {
    let ParsedTypeScriptAst {
        files: parsed_files,
        diagnostics,
    } = parsed_ast;
    let symbol_index = build_symbol_index(&parsed_files);
    let export_index = build_export_index(&parsed_files, &symbol_index);
    let parsed_by_file_id = parsed_files
        .iter()
        .map(|parsed| (parsed.file_id.clone(), parsed))
        .collect::<BTreeMap<_, _>>();
    let mut export_cache = BTreeMap::<String, ExportMap>::new();
    let mut files = BTreeMap::new();
    let mut symbols = BTreeMap::new();
    let mut exports = BTreeMap::new();

    for parsed in parsed_files.iter().cloned() {
        let (file_id, module_specifier, ts_file, file_exports, resolved_symbols) =
            resolve_file(parsed, &symbol_index, &export_index, &parsed_by_file_id, &mut export_cache);

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

    ResolvedTypeScriptGraph {
        files,
        symbols,
        exports,
        diagnostics,
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
) -> BTreeMap<(String, String), String> {
    let parsed_by_file_id = parsed_files
        .iter()
        .map(|parsed| (parsed.file_id.clone(), parsed))
        .collect::<BTreeMap<_, _>>();
    let mut cache = BTreeMap::<String, ExportMap>::new();

    parsed_files
        .iter()
        .flat_map(|parsed| {
            collect_file_exports(&parsed.file_id, &parsed_by_file_id, symbol_index, &mut cache, &mut BTreeSet::new())
                .into_iter()
                .map(|(export_name, symbol_id)| (file_symbol_key(&parsed.file_id, &export_name), symbol_id))
                .collect::<Vec<_>>()
        })
        .collect()
}

fn resolve_symbol_references(
    symbol: SymbolShell,
    symbol_index: &BTreeMap<(String, String), String>,
    export_index: &BTreeMap<(String, String), String>,
    parsed: &ParsedFileAst,
) -> TsSymbol {
    Resolver::new(symbol_index, export_index, parsed).resolve_symbol(symbol)
}

fn resolve_file(
    parsed: ParsedFileAst,
    symbol_index: &BTreeMap<(String, String), String>,
    export_index: &BTreeMap<(String, String), String>,
    parsed_by_file_id: &BTreeMap<String, &ParsedFileAst>,
    export_cache: &mut BTreeMap<String, ExportMap>,
) -> (String, String, TsFile, ExportMap, Vec<TsSymbol>) {
    let ts_file = ts_file_from_parsed(&parsed);
    let file_exports = build_file_exports(&parsed, parsed_by_file_id, symbol_index, export_cache);
    let parsed_view = parsed.clone();
    let resolved_symbols = parsed
        .exports
        .into_iter()
        .map(|symbol| resolve_symbol_references(symbol, symbol_index, export_index, &parsed_view))
        .collect();

    (
        parsed.file_id.clone(),
        parsed.module_specifier.clone(),
        ts_file,
        file_exports,
        resolved_symbols,
    )
}

fn ts_file_from_parsed(parsed: &ParsedFileAst) -> TsFile {
    TsFile {
        path: parsed.file_id.clone(),
        module_specifier: parsed.module_specifier.clone(),
        library: parsed.library.clone(),
    }
}

fn build_file_exports(
    parsed: &ParsedFileAst,
    parsed_by_file_id: &BTreeMap<String, &ParsedFileAst>,
    symbol_index: &BTreeMap<(String, String), String>,
    cache: &mut BTreeMap<String, ExportMap>,
) -> ExportMap {
    collect_file_exports(
        &parsed.file_id,
        parsed_by_file_id,
        symbol_index,
        cache,
        &mut BTreeSet::new(),
    )
}

fn collect_file_exports(
    file_id: &str,
    parsed_by_file_id: &BTreeMap<String, &ParsedFileAst>,
    symbol_index: &BTreeMap<(String, String), String>,
    cache: &mut BTreeMap<String, ExportMap>,
    visited: &mut BTreeSet<String>,
) -> ExportMap {
    if let Some(cached) = cache.get(file_id) {
        return cached.clone();
    }

    if !visited.insert(file_id.to_string()) {
        return BTreeMap::new();
    }

    let Some(parsed) = parsed_by_file_id.get(file_id) else {
        return BTreeMap::new();
    };

    let mut exports = parsed
        .export_bindings
        .iter()
        .filter_map(|(export_name, local_name)| {
            resolve_symbol_id(symbol_index, &parsed.file_id, local_name, &parsed.reexport_target)
                .map(|symbol_id| (export_name.clone(), symbol_id))
        })
        .collect::<ExportMap>();

    for target_file_id in &parsed.export_all_targets {
        for (export_name, symbol_id) in collect_file_exports(
            target_file_id,
            parsed_by_file_id,
            symbol_index,
            cache,
            visited,
        ) {
            exports.entry(export_name).or_insert(symbol_id);
        }
    }

    visited.remove(file_id);
    cache.insert(file_id.to_string(), exports.clone());
    exports
}

fn resolve_symbol_id(
    symbol_index: &BTreeMap<(String, String), String>,
    file_id: &str,
    local_name: &str,
    reexport_target: &BTreeMap<String, (String, String)>,
) -> Option<String> {
    if let Some(id) = symbol_index.get(&file_symbol_key(file_id, local_name)) {
        return Some(id.clone());
    }
    let (target_file, remote_name) = reexport_target.get(local_name)?;
    symbol_index
        .get(&file_symbol_key(target_file, remote_name))
        .cloned()
}
