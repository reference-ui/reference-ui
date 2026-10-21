//! Refusal proofs and the extension guard for the resolve pipeline. They cover unknown style
//! props, bool values that are not valid CSS, the guard that every unrealizable extension is
//! claimed by a lowering, and unknown names that carry help and a fact suggestion. Each test
//! asserts the diagnostic code, message and fact shape rather than atom output. Compiled only
//! under `cfg(test)` as a child of `resolve::tests`.

use super::*;
use crate::diagnostics::{
    DeclarationDetail, DiagnosticCode, DiagnosticFact, DiagnosticsSession, ResolveDetail,
    ResolveOutcome, ValueDetail,
};

#[test]
fn test_unknown_prop_drops_atom_with_diagnostic() {
    let want = Want::new("fooBar", AtomValue::String("x".into()));
    let mut diagnostics = Vec::new();
    let mut session = ResolveSession {
        system: BaseSystem::lib_fixture(),
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(&want, &mut session);
    assert!(atoms.is_empty());
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].message, "Unknown style property \"fooBar\"");
}

#[test]
fn bool_refusals_report_distinct_spellings_with_keys() {
    for (flag, spelling) in [(true, "true"), (false, "false")] {
        let want = Want::new("display", AtomValue::Bool(flag));
        let mut diagnostics = Vec::new();
        let mut facts = DiagnosticsSession::new();
        let system = BaseSystem::default();
        let mut session = ResolveSession {
            system: &system,
            diagnostics: &mut diagnostics,
            location: DiagnosticLocation::default(),
            sink: Some(&mut facts),
            want: None,
        };
        let atoms = resolve_want_with(&want, &mut session);
        drop(session);
        assert!(atoms.is_empty());
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(facts.facts().len(), 1);
        let DiagnosticFact::ResolveOutcome { key, outcome, .. } = &facts.facts()[0] else {
            panic!("bool refusal reports a resolve fact");
        };
        let key = key.as_ref().expect("bool refusal carries its key");
        assert_eq!(key.prop.as_ref(), "display");
        assert_eq!(key.value, serde_json::Value::Bool(flag));
        let ResolveOutcome::Rejected { code, detail } = outcome else {
            panic!("bool refusal rejects");
        };
        assert_eq!(*code, DiagnosticCode::InvalidCssValue);
        let ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::InvalidValue {
            prop,
            value,
        })) = detail
        else {
            panic!("bool refusal names the invalid value");
        };
        assert_eq!(prop.as_ref(), "display");
        assert_eq!(value.as_ref(), spelling);
    }
}

#[test]
fn every_unrealizable_extension_is_claimed_by_a_lowering() {
    let system = BaseSystem::default();
    for name in canon::UNREALIZABLE_EXTENSIONS {
        let want = Want::new(
            *name,
            AtomValue::String("linear-gradient(red, blue)".into()),
        );
        let atoms = resolve_with(&want, &system);
        assert!(!atoms.is_empty(), "{name} must be claimed by a lowering");
        assert_never_serves_own_name(name, &atoms);
        // Other value kinds may refuse, but none may fall through to the
        // fictional declaration.
        for value in [AtomValue::Number("4".into()), AtomValue::Bool(true)] {
            let atoms = resolve_with(&Want::new(*name, value), &system);
            assert_never_serves_own_name(name, &atoms);
        }
    }
}

fn assert_never_serves_own_name(name: &str, atoms: &[Atom]) {
    for atom in atoms {
        assert_ne!(
            atom.prop.as_ref(),
            name,
            "{name} must lower to real CSS, not serve its own name"
        );
    }
}

#[test]
fn extension_lowering_arms_keep_working() {
    let system = BaseSystem::default();
    let gradient = Want::new(
        "textGradient",
        AtomValue::String("linear-gradient(red, blue)".into()),
    );
    assert_eq!(resolve_with(&gradient, &system).len(), 3);
    let pair = Want::new("borderStartRadius", AtomValue::String("4px".into()));
    let corners = resolve_with(&pair, &system);
    assert_eq!(corners.len(), 2);
    assert_eq!(corners[0].prop.as_ref(), "borderStartStartRadius");
    assert_eq!(corners[1].prop.as_ref(), "borderEndStartRadius");
    let platform = Want::new("translate", AtomValue::String("10px".into()));
    assert_eq!(resolve_with(&platform, &system).len(), 1);
}

#[test]
fn unknown_names_emit_help_and_carry_the_fact_suggestion() {
    let system = BaseSystem::default();
    let mut diagnostics = Vec::new();
    let mut facts = DiagnosticsSession::new();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: Some(&mut facts),
        want: None,
    };
    let prop_want = Want::new("colr", AtomValue::String("red".into()));
    assert!(resolve_want_with(&prop_want, &mut session).is_empty());
    let mut when: smallvec::SmallVec<[Box<str>; 2]> = smallvec::SmallVec::new();
    when.push("_hovr".into());
    let cond_want = Want::new("color", AtomValue::String("red".into())).with_when(when);
    assert!(resolve_want_with(&cond_want, &mut session).is_empty());
    drop(session);
    assert_eq!(diagnostics.len(), 2);
    assert_eq!(
        diagnostics[0].help,
        Some(vec![
            "did you mean `color`?".to_string(),
            "remove 'colr' or check its spelling".to_string(),
        ])
    );
    assert_eq!(
        diagnostics[1].help,
        Some(vec![
            "did you mean `_hover`?".to_string(),
            "use a condition from the theme".to_string(),
        ])
    );
    assert_eq!(facts.facts().len(), 2);
    for (fact, expected) in facts.facts().iter().zip(["color", "_hover"]) {
        let DiagnosticFact::ResolveOutcome { suggestion, .. } = fact else {
            panic!("unknown-name refusal reports a resolve fact");
        };
        assert_eq!(suggestion.as_deref(), Some(expected));
    }
}
