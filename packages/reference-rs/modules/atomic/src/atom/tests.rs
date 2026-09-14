//! Unit tests verifying the integrity and serialization of atomic data structures.
//! Exercises instantiation, hashing, deduplication, and JSON round-tripping for atoms, values, and sets.
//! Ensures stable intermediate representation behavior across all compiler stages.

use smallvec::smallvec;

use super::{Atom, AtomSet, AtomValue, Want};

#[test]
fn test_want_creation_and_serialization() {
    let want = Want::new("mt", AtomValue::String("2r".into()))
        .with_when(smallvec!["_hover".into()])
        .with_important(false)
        .with_origin(Some("Button.tsx"));

    assert_eq!(&*want.prop, "mt");
    assert_eq!(want.value, AtomValue::String("2r".into()));
    assert_eq!(want.when.len(), 1);
    assert_eq!(&*want.when[0], "_hover");
    assert!(!want.important);
    assert_eq!(want.origin.as_deref(), Some("Button.tsx"));

    let json = serde_json::to_string(&want).expect("serialize want");
    let roundtrip: Want = serde_json::from_str(&json).expect("deserialize want");
    assert_eq!(want, roundtrip);
}

#[test]
fn test_atom_value_display_and_equality() {
    assert_eq!(AtomValue::String("2r".into()).to_string(), "2r");
    assert_eq!(
        AtomValue::Token {
            path: "colors.blue".into(),
            value: "var(--colors-blue)".into(),
        }
        .to_string(),
        "var(--colors-blue)"
    );
    assert_eq!(AtomValue::Number("100".into()).to_string(), "100");
    assert_eq!(AtomValue::Bool(true).to_string(), "true");
    assert_eq!(AtomValue::Null.to_string(), "null");

    let val = AtomValue::String("red".into());
    let json = serde_json::to_string(&val).expect("serialize value");
    let roundtrip: AtomValue = serde_json::from_str(&json).expect("deserialize value");
    assert_eq!(val, roundtrip);
}

#[test]
fn test_atom_creation_accessors_and_hashing() {
    let atom1 = Atom::new(
        "mt".into(),
        AtomValue::String("2r".into()),
        smallvec![],
        false,
    );

    assert_eq!(atom1.prop(), "mt");
    assert_eq!(atom1.value(), &AtomValue::String("2r".into()));
    assert!(atom1.conditions().is_empty());
    assert!(!atom1.important());
    assert_ne!(atom1.hash(), 0);

    let atom2 = Atom::new(
        "mt".into(),
        AtomValue::String("2r".into()),
        smallvec![],
        false,
    );
    assert_eq!(atom1, atom2);
    assert_eq!(atom1.hash(), atom2.hash());

    let atom_diff = Atom::new(
        "mt".into(),
        AtomValue::String("4r".into()),
        smallvec![],
        false,
    );
    assert_ne!(atom1, atom_diff);
    assert_ne!(atom1.hash(), atom_diff.hash());
}

#[test]
fn test_atom_set_dedup_and_iteration() {
    let mut set = AtomSet::new();
    assert!(set.is_empty());
    assert_eq!(set.len(), 0);

    let atom1 = Atom::new(
        "mt".into(),
        AtomValue::String("2r".into()),
        smallvec![],
        false,
    );
    let atom2 = Atom::new(
        "mt".into(),
        AtomValue::String("2r".into()),
        smallvec![],
        false,
    );
    let atom3 = Atom::new(
        "bg".into(),
        AtomValue::String("n300".into()),
        smallvec![],
        false,
    );

    assert!(set.insert(atom1.clone()));
    assert_eq!(set.len(), 1);
    assert!(!set.is_empty());
    assert!(set.contains(&atom1));

    // Duplicate insertion returns false and does not grow the set
    assert!(!set.insert(atom2));
    assert_eq!(set.len(), 1);

    assert!(set.insert(atom3.clone()));
    assert_eq!(set.len(), 2);

    let collected: Vec<&Atom> = set.iter().collect();
    assert_eq!(collected.len(), 2);

    let into_vec: Vec<Atom> = set.into_iter().collect();
    assert_eq!(into_vec.len(), 2);
}
