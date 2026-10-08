//! Plain ident alias tracing: `const IconShell = Div` carries style edges.
//! Scratch sources plus a hand-built surface keep the tests hermetic:
//! components forwarding through an alias trace (bare, `as`-cast, and
//! chained), factory products trace through the alias exactly like the
//! icons `createIcon` shape, and cycles plus aliases onto untraced
//! targets stay silent. Unannotated params bind through the surface
//! fallback, the shape the real icon shell relies on.

use std::collections::BTreeSet;

use rustc_hash::FxHashMap;

use crate::analysis::{trace_style_bindings_with_surface, StyleSurface};

use super::fixtures::workspace_scratch_dir;

const SHELL_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "const IconShell = Div\n",
    "interface ShellProps {\n",
    "  color?: string\n",
    "}\n",
    "export function Icon({ color }: ShellProps) {\n",
    "  return <IconShell color={color} />\n",
    "}\n",
);

const CAST_SHELL_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "const IconShell = Div as unknown as typeof Div\n",
    "interface ShellProps {\n",
    "  color?: string\n",
    "}\n",
    "export function Icon({ color }: ShellProps) {\n",
    "  return <IconShell color={color} />\n",
    "}\n",
);

const CHAIN_SHELL_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "const Inner = Div\n",
    "const Outer = Inner\n",
    "interface ShellProps {\n",
    "  color?: string\n",
    "}\n",
    "export function Icon({ color }: ShellProps) {\n",
    "  return <Outer color={color} />\n",
    "}\n",
);

const UNANNOTATED_SHELL_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "const IconShell = Div\n",
    "export function Icon({ color, ...rest }: any) {\n",
    "  return (\n",
    "    <IconShell color={color} {...rest} />\n",
    "  )\n",
    "}\n",
);

const FACTORY_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "import * as React from 'react'\n",
    "const IconShell = Div\n",
    "export function createIcon() {\n",
    "  const Icon = React.forwardRef(function MaterialIcon({ color }: { color?: string }, ref: unknown) {\n",
    "    void ref\n",
    "    return <IconShell color={color} />\n",
    "  })\n",
    "  return Icon\n",
    "}\n",
);

const GENERATED_TSX: &str = concat!(
    "import { createIcon } from './factory'\n",
    "export const CheckIcon = createIcon()\n",
);

const CYCLE_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "const A = B\n",
    "const B = A\n",
    "interface ShellProps {\n",
    "  color?: string\n",
    "}\n",
    "export function Icon({ color }: ShellProps) {\n",
    "  return <A color={color} />\n",
    "}\n",
);

const DEAD_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "const Shell = Other\n",
    "interface ShellProps {\n",
    "  color?: string\n",
    "}\n",
    "export function Icon({ color }: ShellProps) {\n",
    "  return <Shell color={color} />\n",
    "}\n",
);

const TYPED_FACTORY_TSX: &str = concat!(
    "import * as React from 'react'\n",
    "import { Div } from '@reference-ui/react'\n",
    "import type { IconProps } from './types'\n",
    "const IconShell = Div as unknown as React.ForwardRefExoticComponent<IconProps>\n",
    "export function createIcon(): IconComponent {\n",
    "  const Icon = React.forwardRef<unknown, IconProps>(function MaterialIcon({ color, ...rest }, ref: unknown) {\n",
    "    void ref\n",
    "    return <IconShell color={color} {...rest} />\n",
    "  })\n",
    "  return Icon\n",
    "}\n",
);

const TYPED_FACTORY_TYPES_TS: &str = concat!(
    "import type { DivProps } from '@reference-ui/react'\n",
    "export type IconProps = Omit<DivProps, 'size'> & { size?: number }\n",
    "export type IconComponent = React.ForwardRefExoticComponent<IconProps>\n",
);

const WRAPPER_ALIAS_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface CardProps {\n",
    "  color?: string\n",
    "}\n",
    "export function Card({ color }: CardProps) {\n",
    "  return <Div color={color} />\n",
    "}\n",
    "const CardAlias = Card\n",
    "export function Wrap({ color }: CardProps) {\n",
    "  return <CardAlias color={color} />\n",
    "}\n",
);

fn ident_surface() -> StyleSurface {
    StyleSurface::new(
        BTreeSet::from(["p".to_string(), "color".to_string(), "size".to_string()]),
        BTreeSet::from(["Div".to_string()]),
    )
}

fn trace_scratch(name: &str, files: &[(&str, &str)], entries: &[&str]) -> crate::TraceOutcome {
    trace_scratch_with_trust(name, files, entries, false)
}

fn trace_scratch_with_trust(
    name: &str,
    files: &[(&str, &str)],
    entries: &[&str],
    trusted: bool,
) -> crate::TraceOutcome {
    let untrusted = ident_surface();
    let surface = if trusted {
        untrusted.trust_surface_type_names()
    } else {
        untrusted
    };
    let scratch = workspace_scratch_dir(name);
    for (rel, content) in files {
        scratch.write(rel, content);
    }
    let entries = entries
        .iter()
        .map(|entry| scratch.root().join(entry))
        .collect::<Vec<_>>();
    let staged = FxHashMap::default();
    let programs = FxHashMap::default();
    let sources = crate::TraceSources {
        staged: &staged,
        programs: &programs,
    };
    trace_style_bindings_with_surface(&entries, scratch.root(), scratch.root(), &surface, &sources)
}

fn binding_names(outcome: &crate::TraceOutcome) -> Vec<String> {
    outcome
        .bindings
        .iter()
        .map(|binding| binding.name.clone())
        .collect()
}

#[test]
fn alias_shell_traces_forwarding_component() {
    let outcome = trace_scratch("ident-alias-shell", &[("shell.tsx", SHELL_TSX)], &["shell.tsx"]);
    assert_eq!(binding_names(&outcome), vec!["Icon".to_string()]);
    assert!(
        outcome.diagnostics.is_empty(),
        "expected no diagnostics, got {:?}",
        outcome.diagnostics
    );
}

#[test]
fn as_cast_alias_shell_traces() {
    let outcome = trace_scratch(
        "ident-alias-cast",
        &[("shell.tsx", CAST_SHELL_TSX)],
        &["shell.tsx"],
    );
    assert_eq!(binding_names(&outcome), vec!["Icon".to_string()]);
}

#[test]
fn chained_alias_shell_traces() {
    let outcome = trace_scratch(
        "ident-alias-chain",
        &[("shell.tsx", CHAIN_SHELL_TSX)],
        &["shell.tsx"],
    );
    assert_eq!(binding_names(&outcome), vec!["Icon".to_string()]);
}

#[test]
fn unannotated_alias_shell_traces_through_surface_fallback() {
    let outcome = trace_scratch(
        "ident-alias-unannotated",
        &[("shell.tsx", UNANNOTATED_SHELL_TSX)],
        &["shell.tsx"],
    );
    assert_eq!(binding_names(&outcome), vec!["Icon".to_string()]);
}

#[test]
fn factory_product_traces_through_alias() {
    let outcome = trace_scratch(
        "ident-alias-factory",
        &[("factory.tsx", FACTORY_TSX), ("check.tsx", GENERATED_TSX)],
        &["factory.tsx", "check.tsx"],
    );
    assert_eq!(binding_names(&outcome), vec!["CheckIcon".to_string()]);
}

#[test]
fn typed_factory_product_traces_without_generated_declarations() {
    let outcome = trace_scratch_with_trust(
        "ident-alias-typed-factory",
        &[
            ("factory.tsx", TYPED_FACTORY_TSX),
            ("types.ts", TYPED_FACTORY_TYPES_TS),
            ("check.tsx", GENERATED_TSX),
        ],
        &["factory.tsx", "check.tsx"],
        true,
    );
    assert_eq!(binding_names(&outcome), vec!["CheckIcon".to_string()]);
    assert!(
        outcome.diagnostics.is_empty(),
        "expected no diagnostics, got {:?}",
        outcome.diagnostics
    );
}

#[test]
fn alias_of_wrapper_traces() {
    let outcome = trace_scratch(
        "ident-alias-wrapper",
        &[("wrap.tsx", WRAPPER_ALIAS_TSX)],
        &["wrap.tsx"],
    );
    assert_eq!(
        binding_names(&outcome),
        vec!["Card".to_string(), "Wrap".to_string()]
    );
}

#[test]
fn alias_cycle_stays_silent() {
    let outcome = trace_scratch("ident-alias-cycle", &[("cycle.tsx", CYCLE_TSX)], &["cycle.tsx"]);
    assert!(binding_names(&outcome).is_empty());
}

#[test]
fn alias_onto_untraced_target_stays_silent() {
    let outcome = trace_scratch("ident-alias-dead", &[("dead.tsx", DEAD_TSX)], &["dead.tsx"]);
    assert!(binding_names(&outcome).is_empty());
}
