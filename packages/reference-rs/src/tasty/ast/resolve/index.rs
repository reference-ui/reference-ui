use std::collections::BTreeMap;

use crate::tasty::ast::model::{ParsedFileAst, ParsedTypeScriptAst, SymbolShell};
use crate::tasty::model::{ExportMap, TsFile, TsSymbol};
use super::graph::ResolvedTypeScriptGraph;
use super::resolver::Resolver;

pub(crate) fn resolve_ast(parsed_ast: ParsedTypeScriptAst) -> ResolvedTypeScriptGraph {
    let ParsedTypeScriptAst {
        files: parsed_files,
        diagnostics,
    } = parsed_ast;
    let symbol_index = build_symbol_index(&parsed_files);
    let export_index = build_export_index(&parsed_files, &symbol_index);
    let mut files = BTreeMap::new();
    let mut symbols = BTreeMap::new();
    let mut exports = BTreeMap::new();

    for parsed in parsed_files {
        let (file_id, module_specifier, ts_file, file_exports, resolved_symbols) =
            resolve_file(parsed, &symbol_index, &export_index);

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

fn build_symbol_index(parsed_files: &[ParsedFileAst]) -> BTreeMap<(String, String), String> {
    parsed_files
        .iter()
        .flat_map(|parsed| {
            parsed.exports.iter().map(|symbol| {
                (
                    (parsed.file_id.clone(), symbol.name.clone()),
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
    parsed_files
        .iter()
        .flat_map(|parsed| {
            parsed
                .export_bindings
                .iter()
                .filter_map(|(export_name, local_name)| {
                    resolve_symbol_id(symbol_index, &parsed.file_id, local_name).map(|symbol_id| {
                        (
                            (parsed.file_id.clone(), export_name.clone()),
                            symbol_id.clone(),
                        )
                    })
                })
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
) -> (String, String, TsFile, ExportMap, Vec<TsSymbol>) {
    let ts_file = ts_file_from_parsed(&parsed);
    let file_exports = build_file_exports(&parsed.file_id, &parsed.export_bindings, symbol_index);
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
    file_id: &str,
    export_bindings: &BTreeMap<String, String>,
    symbol_index: &BTreeMap<(String, String), String>,
) -> ExportMap {
    export_bindings
        .iter()
        .filter_map(|(export_name, local_name)| {
            resolve_symbol_id(symbol_index, file_id, local_name)
                .map(|symbol_id| (export_name.clone(), symbol_id.clone()))
        })
        .collect()
}

fn resolve_symbol_id<'a>(
    symbol_index: &'a BTreeMap<(String, String), String>,
    file_id: &str,
    local_name: &str,
) -> Option<&'a String> {
    symbol_index.get(&(file_id.to_string(), local_name.to_string()))
}
