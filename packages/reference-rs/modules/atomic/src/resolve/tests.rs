//! Lowering proofs for the resolve pipeline: rhythm, shorthands, tokens, and macros.
//! Pins rhythm expansion, border shorthand decomposition, token var() links,
//! the container/size/border-bool macros, and warn-and-skip for leftover
//! Bool/Null pairs. Bool-refusal facts pin distinct true/false spellings with
//! keys. Sits beside `mod.rs` so that file stays under the line budget,
//! mirroring the conditions and cascade tests.

use super::*;
use base_system::{FontDefinition, FontScale};
use indexmap::IndexMap;

use crate::diagnostics::{
    DeclarationDetail, DiagnosticCode, DiagnosticFact, DiagnosticsSession, ResolveDetail,
    ResolveOutcome, ValueDetail,
};

fn resolve_with(want: &Want, system: &BaseSystem) -> Vec<Atom> {
    let mut diagnostics = Vec::new();
    let mut session = ResolveSession {
        system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    resolve_want_with(want, &mut session)
}

#[test]
fn test_resolve_rhythm_want() {
    let want = Want::new("mt", AtomValue::String("2r".into()));
    let atoms = resolve_want(&want);
    assert_eq!(atoms.len(), 1);
    assert_eq!(atoms[0].prop.as_ref(), "mt");
    assert_eq!(atoms[0].value.class_name_str(), "2r");
    assert_eq!(
        atoms[0].value.css_value_str(),
        "calc(2 * var(--spacing-root))"
    );
}

#[test]
fn test_resolve_shorthand_border_want() {
    let want = Want::new("borderBottom", AtomValue::String("3px solid".into()));
    let atoms = resolve_want(&want);
    assert_eq!(atoms.len(), 2);
    assert_eq!(atoms[0].prop.as_ref(), "borderBottomWidth");
    assert_eq!(atoms[0].value.css_value_str(), "3px");
    assert_eq!(atoms[1].prop.as_ref(), "borderBottomStyle");
    assert_eq!(atoms[1].value.css_value_str(), "solid");
}

#[test]
fn test_resolve_token_want() {
    let want = Want::new("color", AtomValue::String("blue.600".into()));
    let atoms = resolve_with(&want, BaseSystem::lib_fixture());
    assert_eq!(atoms.len(), 1);
    assert_eq!(atoms[0].value.class_name_str(), "blue.600");
    assert_eq!(atoms[0].value.css_value_str(), "var(--colors-blue-600)");
}

#[test]
fn test_resolve_container() {
    let want = Want::new("container", AtomValue::String("sidebar".into()));
    let atoms = resolve_want(&want);
    assert_eq!(atoms.len(), 2);
    assert_eq!(atoms[0].prop.as_ref(), "containerType");
    assert_eq!(atoms[0].value.class_name_str(), "inline-size");
    assert_eq!(atoms[1].prop.as_ref(), "containerName");
    assert_eq!(atoms[1].value.class_name_str(), "sidebar");
}

#[test]
fn test_resolve_default_font_and_css_weight() {
    let mut system = BaseSystem::default();
    system.fonts = FontScale::generic();
    let want = Want::new("font", AtomValue::String("sans".into()));
    let atoms = resolve_with(&want, &system);
    assert_eq!(atoms.len(), 2);
    assert_eq!(atoms[0].prop.as_ref(), "fontFamily");
    assert_eq!(atoms[0].value.css_value_str(), "var(--fonts-sans)");
    assert_eq!(atoms[1].prop.as_ref(), "fontWeight");
    assert_eq!(atoms[1].value.class_name_str(), "400");

    let weight_want = Want::new("weight", AtomValue::String("bold".into()));
    let weight_atoms = resolve_with(&weight_want, &system);
    assert_eq!(weight_atoms.len(), 1);
    assert_eq!(weight_atoms[0].prop.as_ref(), "fontWeight");
    assert_eq!(weight_atoms[0].value.class_name_str(), "700");
}

#[test]
fn test_resolve_ingested_font_tracking() {
    let mut css = IndexMap::new();
    css.insert("letterSpacing".to_string(), "-0.01em".to_string());
    css.insert("fontWeight".to_string(), "normal".to_string());
    let mut weights = IndexMap::new();
    weights.insert("normal".to_string(), "400".to_string());
    let mut map = IndexMap::new();
    map.insert(
        "sans".to_string(),
        FontDefinition {
            value: String::new(),
            weights,
            css,
            font_face: None,
        },
    );
    let mut system = BaseSystem::default();
    system.fonts = FontScale::from_definitions(map);

    let want = Want::new("font", AtomValue::String("sans".into()));
    let atoms = resolve_with(&want, &system);
    assert_eq!(atoms.len(), 3);
    assert_eq!(atoms[1].value.class_name_str(), "normal");
    assert_eq!(atoms[2].prop.as_ref(), "letterSpacing");
    assert_eq!(atoms[2].value.class_name_str(), "-0.01em");
}

#[test]
fn test_resolve_size() {
    let want = Want::new("size", AtomValue::String("20px".into()));
    let atoms = resolve_want(&want);
    assert_eq!(atoms.len(), 2);
    assert_eq!(atoms[0].prop.as_ref(), "width");
    assert_eq!(atoms[0].value.class_name_str(), "20px");
    assert_eq!(atoms[1].prop.as_ref(), "height");
    assert_eq!(atoms[1].value.class_name_str(), "20px");
}

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
fn test_resolve_variant_color_mode_empty() {
    let want_variant = Want::new("variant", AtomValue::String("primary".into()));
    assert!(resolve_want(&want_variant).is_empty());

    let want_color_mode = Want::new("colorMode", AtomValue::String("dark".into()));
    assert!(resolve_want(&want_color_mode).is_empty());
}

#[test]
fn test_bool_want_emits_no_atom() {
    let want = Want::new("color", AtomValue::Bool(true));
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(&want, &mut session);
    assert!(atoms.is_empty());
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].message,
        "`color` value `true` is not valid CSS"
    );
}

#[test]
fn test_border_bool_macro_emits_width_and_style() {
    let want = Want::new("border", AtomValue::Bool(true));
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(&want, &mut session);
    assert!(diagnostics.is_empty(), "{diagnostics:?}");
    assert_eq!(atoms.len(), 2);
    assert_eq!(atoms[0].prop.as_ref(), "borderWidth");
    assert_eq!(atoms[0].value.css_value_str(), "1px");
    assert_eq!(atoms[1].prop.as_ref(), "borderStyle");
    assert_eq!(atoms[1].value.css_value_str(), "solid");
}

#[test]
fn test_border_false_still_warns_and_skips() {
    let want = Want::new("border", AtomValue::Bool(false));
    let atoms = resolve_want(&want);
    assert!(atoms.is_empty());
}

#[test]
fn test_null_want_strips_silently() {
    let want = Want::new("color", AtomValue::Null);
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(&want, &mut session);
    assert!(atoms.is_empty());
    assert!(diagnostics.is_empty());
}

#[test]
fn test_container_bool_still_lowers() {
    let want = Want::new("container", AtomValue::Bool(true));
    let atoms = resolve_want(&want);
    assert_eq!(atoms.len(), 1);
    assert_eq!(atoms[0].prop.as_ref(), "containerType");
    assert_eq!(atoms[0].value.css_value_str(), "inline-size");
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
fn unrealizable_extension_refuses_with_named_diagnostic_and_no_atoms() {
    for prop in ["translateX", "boxSize", "spaceX"] {
        let want = Want::new(prop, AtomValue::String("10px".into()));
        let mut diagnostics = Vec::new();
        let system = BaseSystem::default();
        let mut session = ResolveSession {
            system: &system,
            diagnostics: &mut diagnostics,
            location: DiagnosticLocation::default(),
            sink: None,
            want: None,
        };
        let atoms = resolve_want_with(&want, &mut session);
        drop(session);
        assert!(atoms.is_empty(), "{prop} yields no atoms");
        assert_eq!(diagnostics.len(), 1, "{prop} warns once");
        assert_eq!(diagnostics[0].code, DiagnosticCode::UnrealizableExtension);
        assert!(
            diagnostics[0].message.contains(prop),
            "refusal names the prop: {}",
            diagnostics[0].message
        );
    }
}

#[test]
fn unrealizable_fall_through_keeps_lowering_arms_working() {
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
fn authored_key_carries_the_five_tuple() {
    let mut when: smallvec::SmallVec<[Box<str>; 2]> = smallvec::SmallVec::new();
    when.push("_hover".into());
    let context = WantContext {
        when: when.as_slice(),
        important: true,
    };
    let key = authored_key(
        "test",
        "color",
        serde_json::Value::String("red".to_string()),
        &context,
    );
    assert_eq!(key.system.as_ref(), "test");
    assert_eq!(key.when, vec![Box::<str>::from("_hover")]);
    assert_eq!(key.prop.as_ref(), "color");
    assert_eq!(key.value, serde_json::Value::String("red".to_string()));
    assert!(key.important);
    assert_eq!(
        key.lookup_key(),
        r#"["test",["_hover"],"color","red",true]"#
    );
}

/// Props matched on the authored spelling (`lower_macro`, `is_runtime_owned`,
/// the `font`/`fontFamily` bare-number exemption) rather than canonical.
const AUTHORED_MATCH_PROPS: &[&str] = &[
    "font", "weight", "container", "size", "textGradient", "border", "variant", "colorMode",
    "fontFamily",
];

#[test]
fn test_no_alias_targets_authored_match_prop() {
    // A future alias onto a macro prop would skip the macro here while a
    // canonical-keyed lowering table would apply it. Pin the gap shut.
    for alias in canon::ALIASES {
        assert!(
            !AUTHORED_MATCH_PROPS.contains(&alias.canonical),
            "alias {} targets authored-match prop {}",
            alias.alias,
            alias.canonical
        );
    }
}
