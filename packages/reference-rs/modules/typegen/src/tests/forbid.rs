//! TYP-FORBID-03–06: the printer is a `.d.ts` string, not a codegen farm.
//! Layout pattern types, per-recipe module paths, and runtime token JS must
//! not appear in `emit_dts` output. FORBID-04 uses one dump with `button` and
//! `badge` so both variant aliases live in that single string. FORBID-05/06
//! also inspect production sources and `Cargo.toml`: no `.mjs` writer, no
//! `atomic` crate. `canon` is required for StyleProps; it is not `atomic`.

use super::{
    assert_matches_golden, catalog_dts, compound_dts, font_dts, font_style_dts, recipe_dts,
    style_dts, two_recipe_dts,
};
use crate::emit_dts;
use base_system::BaseSystem;
use std::fs;
use std::path::{Path, PathBuf};

fn forbid_emits() -> Vec<String> {
    vec![
        emit_dts(&BaseSystem::default()),
        catalog_dts(),
        recipe_dts(),
        compound_dts(),
        font_dts(),
        two_recipe_dts(),
        style_dts(),
        font_style_dts(),
    ]
}

fn assert_absent(label: &str, dts: &str, needles: &[&str]) {
    for needle in needles {
        assert!(
            !dts.contains(needle),
            "{label}: emitted text contains `{needle}`:\n{dts}"
        );
    }
}

fn crate_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn collect_rs_files(dir: &Path, files: &mut Vec<PathBuf>) {
    let entries = fs::read_dir(dir).unwrap_or_else(|err| {
        panic!("read {}: {err}", dir.display())
    });
    for entry in entries {
        let path = entry.unwrap_or_else(|err| panic!("dirent: {err}")).path();
        if path.is_dir() {
            collect_rs_files(&path, files);
            continue;
        }
        if path.extension().is_some_and(|ext| ext == "rs") {
            files.push(path);
        }
    }
}

fn production_rust_sources() -> Vec<(PathBuf, String)> {
    let mut files = Vec::new();
    collect_rs_files(&crate_root().join("src"), &mut files);
    files
        .into_iter()
        .filter(|path| !path.components().any(|c| c.as_os_str() == "tests"))
        .map(|path| {
            let text = fs::read_to_string(&path).unwrap_or_else(|err| {
                panic!("read {}: {err}", path.display())
            });
            (path, text)
        })
        .collect()
}

/// TYP-FORBID-03 — no layout pattern helper types or `patterns/` farm.
#[test]
fn typ_forbid_03_emits_no_layout_pattern_helpers() {
    let needles = [
        "BoxProps",
        "FlexProps",
        "StackProps",
        "GridProps",
        "patterns/",
    ];
    for dts in forbid_emits() {
        assert_absent("TYP-FORBID-03", &dts, &needles);
    }
}

/// TYP-FORBID-04 — multiple recipes are one `.d.ts` string, not `recipes/*.d.ts`.
#[test]
fn typ_forbid_04_emits_recipe_types_in_one_string_not_modules() {
    let dts = two_recipe_dts();
    assert!(
        dts.contains("export type ButtonVariantProps")
            && dts.contains("export type BadgeVariantProps"),
        "TYP-FORBID-04: both variant types must live in the same string:\n{dts}"
    );
    let module_needles = ["recipes/button.d.ts", "recipes/badge.d.ts", "recipes/"];
    assert_absent("TYP-FORBID-04", &dts, &module_needles);
    for other in [catalog_dts(), recipe_dts(), compound_dts(), font_dts(), style_dts(), font_style_dts()] {
        assert_absent("TYP-FORBID-04", &other, &["recipes/"]);
    }
    assert_matches_golden("recipes-two.d.ts", &dts);
}

/// TYP-FORBID-05 — declaration text only; no runtime token JS or `.mjs` writer.
#[test]
fn typ_forbid_05_emits_no_runtime_token_javascript() {
    let needles = ["tokens.mjs", "export function token", "token("];
    for dts in forbid_emits() {
        assert_absent("TYP-FORBID-05", &dts, &needles);
    }
    for (path, src) in production_rust_sources() {
        assert!(
            !src.contains(".mjs") && !src.contains("export function token"),
            "TYP-FORBID-05: production source {} writes runtime JS:\n{src}",
            path.display()
        );
        assert!(
            !src.contains("std::fs") && !src.contains("fs::write"),
            "TYP-FORBID-05: production source {} writes files; emit_dts is a string:\n{src}",
            path.display()
        );
    }
}

/// TYP-FORBID-06 — typegen must not depend on the `atomic` crate or AtomSet.
#[test]
fn typ_forbid_06_does_not_depend_on_atomic() {
    let manifest = fs::read_to_string(crate_root().join("Cargo.toml"))
        .unwrap_or_else(|err| panic!("read Cargo.toml: {err}"));
    assert!(
        !manifest.contains("atomic"),
        "TYP-FORBID-06: Cargo.toml must not mention atomic:\n{manifest}"
    );
    assert!(
        manifest.contains("base_system"),
        "TYP-FORBID-06: typegen must depend on base_system:\n{manifest}"
    );
    assert!(
        manifest.contains("canon"),
        "TYP-FORBID-06: StyleProps requires a canon dependency:\n{manifest}"
    );
    let import_needles = [
        format!("use {}", "atomic"),
        format!("{}::", "atomic"),
        format!("extern crate {}", "atomic"),
        String::from("AtomSet"),
    ];
    for (path, src) in production_rust_sources() {
        for needle in &import_needles {
            assert!(
                !src.contains(needle),
                "TYP-FORBID-06: {} imports `{needle}`:\n{src}",
                path.display()
            );
        }
    }
}
