//! Staleness soundness: written values never resolve at use sites.
//!
//! Proves baked entries, destructured names, and deleted properties strip
//! on write and diagnose instead of ghosting, the single-file `extract()`
//! backs its import stub with the file's own constants so writes poison,
//! and spread-call refusals warn without recording a harvest sink.

use super::{channel_for, compile_code_logs, is_harvest};

#[test]
fn test_baked_object_entry_never_resolves_stale() {
    // Soundness net for the scope dep-strip (SPEC-V2-34 object half): the
    // entry baked from `inherit` strips when `tone` is written, so the stale
    // init never resolves at the site and the use diagnoses instead of
    // ghosting. Harvest still mints the program's literals onto the refused
    // sink (Forge §2/§3: both allowlisted colors harvest; which is live is
    // a write question) — those wants carry the harvest origin, never the
    // site's.
    let res = compile_code_logs(
        r#"import { css } from '@reference-ui/react';
        let tone = 'inherit';
        const theme = { primary: tone };
        tone = 'currentColor';
        export const a = css({ color: theme.primary });"#,
    );
    assert!(res
        .wants
        .iter()
        .filter(|w| !is_harvest(w))
        .all(|w| w.value.to_string() != "inherit"));
    assert!(res
        .wants
        .iter()
        .any(|w| is_harvest(w) && w.value.to_string() == "inherit"));
    assert!(res
        .wants
        .iter()
        .any(|w| is_harvest(w) && w.value.to_string() == "currentColor"));
    assert!(res.diagnostics.is_empty());
    let members = channel_for(&res, crate::DiagnosticCode::DynamicMember);
    assert_eq!(members.len(), 1);
    let harvests = channel_for(&res, crate::DiagnosticCode::HarvestSink);
    assert_eq!(harvests.len(), 1);
}

#[test]
fn test_destructured_name_never_resolves_stale() {
    // Soundness net for destructure provenance (SPEC-V2-32): names copied
    // from a written object strip with it — the stale leaf never resolves
    // at the site. Harvest still mints the program's literals onto the
    // refused sink (Forge §2/§3) under the harvest origin, never the site's.
    let res = compile_code_logs(
        r#"import { css } from '@reference-ui/react';
        let theme = { primary: 'inherit' };
        const { primary } = theme;
        theme.primary = 'currentColor';
        export const a = css({ color: primary });"#,
    );
    assert!(res
        .wants
        .iter()
        .filter(|w| !is_harvest(w))
        .all(|w| w.value.to_string() != "inherit"));
    assert!(res
        .wants
        .iter()
        .any(|w| is_harvest(w) && w.value.to_string() == "inherit"));
    assert!(res
        .wants
        .iter()
        .any(|w| is_harvest(w) && w.value.to_string() == "currentColor"));
    assert!(res.diagnostics.is_empty());
    let idents = channel_for(&res, crate::DiagnosticCode::DynamicIdentifier);
    assert_eq!(idents.len(), 1);
    assert!(idents[0].message.contains("'primary'"), "{}", idents[0].message);
}

#[test]
fn test_delete_poison_never_resolves_stale() {
    // Soundness net for `delete` as a write (SPEC-V2-81): the deleted init
    // drops exactly like an assignment, with a diagnostic naming the delete.
    let res = compile_code_logs(
        r#"import { css } from '@reference-ui/react';
        const o = { color: 'red' };
        delete o.color;
        export const a = css({ color: o.color });"#,
    );
    assert!(res.wants.is_empty());
    assert!(res.diagnostics.is_empty());
    let poisoned = channel_for(&res, crate::DiagnosticCode::MutatedBinding);
    assert_eq!(poisoned.len(), 1);
    assert!(poisoned[0].message.contains("deleted at"));
}

#[test]
fn test_bare_extract_collects_file_mutations() {
    // The single-file `extract()` backs its import stub with the file's own
    // constants, so a write in the file poisons instead of resolving stale.
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    let code = r#"import { css } from '@reference-ui/react';
        const o = { color: 'red' };
        delete o.color;
        export const a = css({ color: o.color });"#;
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(std::path::Path::new("t.ts"))
        .unwrap_or_default()
        .with_typescript(true);
    let parsed = Parser::new(&allocator, code, source_type).parse();
    assert!(!parsed.panicked);

    let system = crate::BaseSystem::lib_fixture().clone();
    let mut wants = Vec::new();
    let mut recipes = Vec::new();
    let mut diagnostics = Vec::new();
    let mut authored = Vec::new();
    let sinks = crate::extract::ExtractSinks {
        wants: &mut wants,
        recipes: &mut recipes,
        diagnostics: &mut diagnostics,
        authored: &mut authored,
        sinks: &mut Vec::new(),
        session: &mut crate::diagnostics::DiagnosticsSession::new(),
        recipe_bindings: &mut Vec::new(),
        tentative: &mut Vec::new(),
    };
    crate::extract::extract(&parsed.program, "t.ts", system.breakpoints(), sinks);

    assert!(wants.is_empty());
    assert_eq!(diagnostics.len(), 1);
    assert!(diagnostics[0].message.contains("deleted at"));
}

#[test]
fn test_spread_call_refusal_warns_without_sink() {
    // Slice 3 Q5b exclusion pin: a folded-object spread warns its refused
    // call fragments without recording a harvest sink — the fragment is
    // interior to the call's arguments with no prop in scope, so it is not
    // a mintable value position. The folded entries still lower.
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    let code = r#"import { css } from '@reference-ui/react';
        const pick = (o) => o;
        export const a = css({ ...pick({ color: 'red', bg: dyn }) });"#;
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(std::path::Path::new("t.ts"))
        .unwrap_or_default()
        .with_typescript(true);
    let parsed = Parser::new(&allocator, code, source_type).parse();
    assert!(!parsed.panicked);

    let system = crate::BaseSystem::lib_fixture().clone();
    let mut wants = Vec::new();
    let mut recipes = Vec::new();
    let mut diagnostics = Vec::new();
    let mut authored = Vec::new();
    let mut sinks = Vec::new();
    let sinks_to = crate::extract::ExtractSinks {
        wants: &mut wants,
        recipes: &mut recipes,
        diagnostics: &mut diagnostics,
        authored: &mut authored,
        sinks: &mut sinks,
        session: &mut crate::diagnostics::DiagnosticsSession::new(),
        recipe_bindings: &mut Vec::new(),
        tentative: &mut Vec::new(),
    };
    crate::extract::extract(&parsed.program, "t.ts", system.breakpoints(), sinks_to);

    assert!(wants.iter().any(|w| &*w.prop == "color"));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].code,
        crate::diagnostics::DiagnosticCode::DynamicExpression
    );
    assert!(diagnostics[0].message.contains("keeping sibling properties"));
    assert!(sinks.is_empty(), "spread refusals record no sink");
}
