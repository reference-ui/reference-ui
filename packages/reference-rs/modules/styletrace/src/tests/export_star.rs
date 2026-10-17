//! `export *` exposure: a star source never re-exports `default`, and a module's own export shadows a
//! star name of the same spelling. Each case traces the star target as its own entry first, so the
//! binding the barrel must not inherit is shown to exist, then traces the barrel, which must list nothing.

use super::member_alias::{binding_names, trace_scratch};

const CARD_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface CardProps {\n",
    "  p?: string\n",
    "}\n",
    "export default function Card(props: CardProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
);

const BUTTON_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface ButtonProps {\n",
    "  p?: string\n",
    "}\n",
    "export function Button(props: ButtonProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
);

/// The barrel's own `Button` reaches no primitive, so it does not trace.
const OWN_BUTTON_BARREL_TSX: &str = concat!(
    "export function Button({ label }: { label: string }) {\n",
    "  return <span>{label}</span>\n",
    "}\n",
    "export * from './button'\n",
);

#[test]
fn export_star_never_reexports_the_default_export() {
    let files = [
        ("barrel.tsx", "export * from './card'\n"),
        ("card.tsx", CARD_TSX),
    ];
    let control = trace_scratch("export-star-default-control", &files, "card.tsx");
    assert_eq!(binding_names(&control), vec!["default".to_string()]);

    let outcome = trace_scratch("export-star-default", &files, "barrel.tsx");
    assert!(
        binding_names(&outcome).is_empty(),
        "barrel re-exported the default export: {:?}",
        binding_names(&outcome)
    );
}

#[test]
fn own_export_shadows_a_traced_star_name() {
    let files = [
        ("barrel.tsx", OWN_BUTTON_BARREL_TSX),
        ("button.tsx", BUTTON_TSX),
    ];
    let control = trace_scratch("export-star-shadow-control", &files, "button.tsx");
    assert_eq!(binding_names(&control), vec!["Button".to_string()]);

    let outcome = trace_scratch("export-star-shadow", &files, "barrel.tsx");
    assert!(
        binding_names(&outcome).is_empty(),
        "barrel listed a star Button that its own export shadows: {:?}",
        binding_names(&outcome)
    );
}
