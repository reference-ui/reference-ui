//! Owned-props tracing through a wrapper's type argument: a `forwardRef` generic and the
//! factory product built from one. The inner function of a `forwardRef` carries no
//! parameter annotation, so its declared props reach the trace only through the generic.
//! Destructured members of that declaration are the component's own API and stay owned,
//! while members riding `rest` into a primitive are forwarded and keep extracting.
//! Scratch sources keep each case hermetic; the surface comes from `owned_props`.

use std::collections::BTreeSet;

use super::owned_props::{test_surface, trace_scratch};

const FORWARD_REF_TYPES_TS: &str =
    "export type StyleProps = {\n  color?: string\n  size?: string\n}\n";

const FORWARD_REF_TSX: &str = concat!(
    "import * as React from 'react'\n",
    "import { Div } from '@reference-ui/react'\n",
    "import type { StyleProps } from './types'\n",
    "export type ButtonProps = StyleProps & {\n",
    "  size?: 'sm' | 'md'\n",
    "  variant?: 'primary' | 'secondary'\n",
    "  p?: string\n",
    "}\n",
    "export const Button = React.forwardRef<HTMLDivElement, ButtonProps>(function Button(\n",
    "  { size, variant, ...rest },\n",
    "  ref\n",
    ") {\n",
    "  void size\n",
    "  void variant\n",
    "  return <Div ref={ref} {...rest} />\n",
    "})\n",
);

const FACTORY_TSX: &str = concat!(
    "import * as React from 'react'\n",
    "import { Div } from '@reference-ui/react'\n",
    "import type { StyleProps } from './types'\n",
    "export type IconProps = StyleProps & {\n",
    "  size?: 'sm' | 'md'\n",
    "  variant?: 'outline' | 'filled'\n",
    "}\n",
    "export function createIcon(displayName: string) {\n",
    "  const Icon = React.forwardRef<HTMLDivElement, IconProps>(function MaterialIcon(\n",
    "    { variant, size, ...rest },\n",
    "    ref\n",
    "  ) {\n",
    "    void variant\n",
    "    void size\n",
    "    return <Div ref={ref} {...rest} />\n",
    "  })\n",
    "  Icon.displayName = displayName\n",
    "  return Icon\n",
    "}\n",
    "export const CodeIcon = createIcon('CodeIcon')\n",
);

#[test]
fn forward_ref_generic_declares_owned_props() {
    let surface = test_surface();
    let outcome = trace_scratch(
        "owned-wrappers-forward-ref",
        &[
            ("types.ts", FORWARD_REF_TYPES_TS),
            ("Button.tsx", FORWARD_REF_TSX),
        ],
        "Button.tsx",
        &surface,
    );

    let names: Vec<String> = outcome.bindings.iter().map(|b| b.name.clone()).collect();
    assert_eq!(names, vec!["Button".to_string()]);

    // `size` and `variant` are pulled out by name; `p` is declared but rides `rest`
    // into the primitive, so it must not be owned.
    assert_eq!(
        outcome
            .owned_props
            .get("Button")
            .cloned()
            .unwrap_or_default(),
        BTreeSet::from(["size".to_string(), "variant".to_string()])
    );
}

#[test]
fn factory_product_owns_its_destructured_forward_ref_props() {
    let surface = test_surface();
    let outcome = trace_scratch(
        "owned-wrappers-factory",
        &[
            ("types.ts", FORWARD_REF_TYPES_TS),
            ("createIcon.tsx", FACTORY_TSX),
        ],
        "createIcon.tsx",
        &surface,
    );

    let names: Vec<String> = outcome.bindings.iter().map(|b| b.name.clone()).collect();
    assert_eq!(names, vec!["CodeIcon".to_string()]);

    assert_eq!(
        outcome
            .owned_props
            .get("CodeIcon")
            .cloned()
            .unwrap_or_default(),
        BTreeSet::from(["size".to_string(), "variant".to_string()])
    );
}
