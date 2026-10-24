//! Consts copied from imports, over virtual sources.
//! The copy sits in the exporting file (a chain of files, an object, a written target, mutual
//! copies) or in the consuming file itself (one copy, a chain of copies, a written import, a forward
//! reference). Each folds to the import's value or names the write, and none misses silently.

use super::{channel_messages_for, compile_files, compile_files_logs, has_site_want, has_want};

#[test]
fn const_copied_from_an_import_folds_through_a_chain_of_files() {
    let res = compile_files(&[
        ("/v/src/f0.ts", "export const v0 = 'red'"),
        ("/v/src/f1.ts", "import { v0 } from './f0'\nexport const v1 = v0"),
        ("/v/src/f2.ts", "import { v1 } from './f1'\nexport const v2 = v1"),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { v2 } from './f2'\ncss({ color: v2 })",
        ),
    ]);
    assert!(has_want(&res, "color", "red"));
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

#[test]
fn style_object_copied_from_an_import_folds() {
    let res = compile_files(&[
        ("/v/src/base.ts", "export const base = { color: 'red' }"),
        (
            "/v/src/copy.ts",
            "import { base } from './base'\nexport const copy = base",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { copy } from './copy'\ncss(copy)",
        ),
    ]);
    assert!(has_want(&res, "color", "red"));
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

#[test]
fn const_copied_from_a_mutated_import_names_the_write() {
    let res = compile_files_logs(&[
        ("/v/src/f0.ts", "export let v0 = 'red'\nv0 = 'blue'"),
        ("/v/src/f1.ts", "import { v0 } from './f0'\nexport const v1 = v0"),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { v1 } from './f1'\ncss({ color: v1 })",
        ),
    ]);
    assert!(!has_want(&res, "color", "red"));
    let poisoned = channel_messages_for(&res, crate::DiagnosticCode::MutatedBinding);
    assert_eq!(poisoned.len(), 1, "{poisoned:?}");
    assert!(
        poisoned[0].contains("reassigned at /v/src/f0.ts:2:1"),
        "{poisoned:?}"
    );
}

#[test]
fn const_copies_that_import_each_other_terminate_without_a_value() {
    let res = compile_files(&[
        ("/v/src/a.ts", "import { b } from './b'\nexport const a = b"),
        ("/v/src/b.ts", "import { a } from './a'\nexport const b = a"),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { a } from './a'\ncss({ color: a })",
        ),
    ]);
    assert!(!has_site_want(&res, "color", "red"));
}

#[test]
fn same_file_copy_of_an_import_folds_through_a_chain_of_copies() {
    let res = compile_files(&[
        ("/v/src/f0.ts", "export const v0 = 'red'"),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { v0 } from './f0'\nconst v1 = v0\nconst v2 = v1\ncss({ color: v2 })",
        ),
    ]);
    assert!(has_want(&res, "color", "red"));
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

#[test]
fn same_file_copy_of_an_imported_style_object_folds() {
    let res = compile_files(&[
        ("/v/src/base.ts", "export const base = { color: 'red' }"),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { base } from './base'\nconst copy = base\ncss(copy)",
        ),
    ]);
    assert!(has_want(&res, "color", "red"));
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

#[test]
fn same_file_copy_of_a_mutated_import_names_the_write() {
    let res = compile_files_logs(&[
        ("/v/src/f0.ts", "export let v0 = 'red'\nv0 = 'blue'"),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { v0 } from './f0'\nconst v1 = v0\ncss({ color: v1 })",
        ),
    ]);
    assert!(!has_want(&res, "color", "red"));
    let poisoned = channel_messages_for(&res, crate::DiagnosticCode::MutatedBinding);
    assert_eq!(poisoned.len(), 1, "{poisoned:?}");
}

#[test]
fn same_file_copy_declared_before_its_target_stays_valueless() {
    let res = compile_files(&[
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nconst v1 = v0\nconst v0 = 'red'\ncss({ color: v1 })",
        ),
    ]);
    assert!(!has_site_want(&res, "color", "red"));
}

#[test]
fn same_file_copies_of_each_other_terminate_without_a_value() {
    let res = compile_files(&[(
        "/v/src/app.ts",
        "import { css } from '@reference-ui/react'\nconst a = b\nconst b = a\ncss({ color: a })",
    )]);
    assert!(!has_site_want(&res, "color", "red"));
}
