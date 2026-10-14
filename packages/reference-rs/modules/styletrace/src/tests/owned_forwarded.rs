//! Owned-props tracing for destructured props the body passes on. A destructured prop stops being
//! owned only when it reaches an element under its own name: `id={id}`, `size={size}`, or a
//! spread whose object literal still carries that name. Reflecting it under another name
//! (`w={size}`, `data-size={size}`), in a child or in a condition leaves it owned. Scratch sources
//! and the shared hand-built surface keep each case hermetic.

use std::collections::{BTreeMap, BTreeSet};

use super::owned_props::{test_surface, trace_scratch};

const TYPES_TS: &str = "export type StyleProps = {\n  color?: string\n  size?: string\n}\n";

const IMPORTS: &str = concat!(
    "import type { StyleProps } from './types'\n",
    "import { Div } from '@reference-ui/react'\n",
);

// Passed on under the prop's own name: not owned.

const CARD: &str = concat!(
    "export type CardProps = StyleProps & { id?: string }\n",
    "export function Card({ id, ...styleProps }: CardProps) {\n",
    "  return <Div id={id} {...styleProps}>card</Div>\n",
    "}\n",
);

const RENAMED: &str = concat!(
    "export type CardProps = StyleProps & { id?: string }\n",
    "export function Card({ id: ident, ...rest }: CardProps) {\n",
    "  return <Div id={ident} {...rest} />\n",
    "}\n",
);

const QUOTED: &str = concat!(
    "export type TagProps = StyleProps & { 'item-id'?: string }\n",
    "export function Tag({ 'item-id': itemId, ...rest }: TagProps) {\n",
    "  return <Div item-id={itemId} {...rest} />\n",
    "}\n",
);

const STYLE_PROP: &str = concat!(
    "export type ButtonProps = StyleProps & { size?: 'sm' | 'md'; variant?: 'primary' | 'secondary' }\n",
    "export function Button({ size, variant, ...rest }: ButtonProps) {\n",
    "  void variant\n",
    "  return <Div size={size} {...rest} />\n",
    "}\n",
);

const FORMS: &str = concat!(
    "export type FormsProps = StyleProps & {\n",
    "  parens?: string\n",
    "  cast?: string\n",
    "  nonNull?: string\n",
    "  fallback?: string\n",
    "  branch?: string\n",
    "  sum?: number\n",
    "  kept?: string\n",
    "}\n",
    "export function Forms({ parens, cast, nonNull, fallback, branch, sum, kept, ...rest }: FormsProps) {\n",
    "  const ready = kept !== undefined\n",
    "  return (\n",
    "    <Div\n",
    "      parens={(parens)}\n",
    "      cast={cast as string}\n",
    "      nonNull={nonNull!}\n",
    "      fallback={fallback ?? 'none'}\n",
    "      branch={ready ? branch : undefined}\n",
    "      sum={sum + 1}\n",
    "      {...rest}\n",
    "    />\n",
    "  )\n",
    "}\n",
);

const COMPONENT_TARGET: &str = concat!(
    "export type ToolbarProps = StyleProps & { size?: 'sm' | 'md' }\n",
    "export function Toolbar({ size, ...rest }: ToolbarProps) {\n",
    "  return (\n",
    "    <Div {...rest}>\n",
    "      <Icon size={size} />\n",
    "    </Div>\n",
    "  )\n",
    "}\n",
);

const SPREAD_LITERAL: &str = concat!(
    "export type SpreadProps = StyleProps & { size?: string; tone?: string; wide?: boolean; kept?: string }\n",
    "export function Spreads({ size, tone, wide, kept, ...rest }: SpreadProps) {\n",
    "  void kept\n",
    "  return <Div {...{ size }} {...{ tone: tone }} {...(wide && { wide })} {...rest} />\n",
    "}\n",
);

const BODY_DESTRUCTURE: &str = concat!(
    "export type CardProps = StyleProps & { id?: string }\n",
    "export function Card(props: CardProps) {\n",
    "  const { id, ...styleProps } = props\n",
    "  return <Div id={id} {...styleProps} />\n",
    "}\n",
);

const ARROW: &str = concat!(
    "export type CardProps = StyleProps & { id?: string }\n",
    "export const Card = ({ id, ...rest }: CardProps) => <Div id={id} {...rest} />\n",
);

const FORWARD_REF: &str = concat!(
    "import * as React from 'react'\n",
    "export type ButtonProps = StyleProps & { size?: 'sm' | 'md'; variant?: 'primary' | 'secondary' }\n",
    "export const Button = React.forwardRef<HTMLDivElement, ButtonProps>(function Button(\n",
    "  { size, variant, ...rest },\n",
    "  ref\n",
    ") {\n",
    "  void variant\n",
    "  return <Div ref={ref} size={size} {...rest} />\n",
    "})\n",
);

// Reflected under another name, read in a child or a condition: owned.

const MIXED: &str = concat!(
    "export type MeterProps = StyleProps & { id?: string; size?: 'sm' | 'md' }\n",
    "export function Meter({ id, size, ...rest }: MeterProps) {\n",
    "  void size\n",
    "  return <Div id={id} {...rest} />\n",
    "}\n",
);

const OTHER_NAME: &str = concat!(
    "export type BoxProps = StyleProps & { size?: 'sm' | 'md' }\n",
    "export function Box({ size, ...rest }: BoxProps) {\n",
    "  return <Div w={size} {...rest} />\n",
    "}\n",
);

const CROSSED: &str = concat!(
    "export type SwapProps = StyleProps & { size?: string; width?: string }\n",
    "export function Swap({ size, width, ...rest }: SwapProps) {\n",
    "  return <Div size={width} width={size} {...rest} />\n",
    "}\n",
);

const LOCAL_NAME: &str = concat!(
    "export type CardProps = StyleProps & { id?: string }\n",
    "export function Card({ id: ident, ...rest }: CardProps) {\n",
    "  return <Div ident={ident} {...rest} />\n",
    "}\n",
);

const DOM_MIRROR: &str = concat!(
    "import * as React from 'react'\n",
    "export type TileProps = StyleProps & { size?: 'sm' | 'md' | 'lg'; label?: string }\n",
    "export const Tile = React.forwardRef<HTMLDivElement, TileProps>(function Tile(\n",
    "  { size, label, ...rest },\n",
    "  ref\n",
    ") {\n",
    "  return <Div ref={ref} data-size={size} aria-label={label} {...rest} />\n",
    "})\n",
);

const SPREAD_OTHER_NAME: &str = concat!(
    "export type MirrorProps = StyleProps & { size?: string; extra?: Record<string, string> }\n",
    "export function Mirror({ size, extra, ...rest }: MirrorProps) {\n",
    "  return <Div {...{ w: size }} {...{ 'data-size': size }} {...extra} {...rest} />\n",
    "}\n",
);

const CHILDREN: &str = concat!(
    "export type LabelProps = StyleProps & { size?: 'sm' | 'lg' }\n",
    "export function Label({ size, ...rest }: LabelProps) {\n",
    "  const wide = size === 'lg'\n",
    "  return <Div {...rest}>{size}{wide ? size : 'none'}</Div>\n",
    "}\n",
);

const CONDITION: &str = concat!(
    "export type PickProps = StyleProps & { size?: 'sm' | 'lg' }\n",
    "export function Pick({ size, ...rest }: PickProps) {\n",
    "  return <Div size={size === 'sm' ? 'x' : 'y'} {...rest} />\n",
    "}\n",
);

/// The trace's owned map for a one-file host; the host must itself trace, so an empty map means
/// "owns nothing" and never "was not traced".
fn owned_map(scratch: &str, host: &str, body: &str) -> BTreeMap<String, BTreeSet<String>> {
    let source = format!("{IMPORTS}{body}");
    let outcome = trace_scratch(
        scratch,
        &[("types.ts", TYPES_TS), ("Host.tsx", &source)],
        "Host.tsx",
        &test_surface(),
    );
    let names: Vec<String> = outcome.bindings.iter().map(|b| b.name.clone()).collect();
    assert_eq!(names, vec![host.to_string()]);
    outcome.owned_props
}

fn owned(host: &str, names: &[&str]) -> BTreeMap<String, BTreeSet<String>> {
    let names = names.iter().map(|name| name.to_string()).collect();
    BTreeMap::from([(host.to_string(), names)])
}

#[test]
fn forwarded_under_its_own_name_is_not_owned() {
    // The NEO-SYNC-15 Card: `id={id}` hands `id` to the primitive, so Card keeps nothing.
    let map = owned_map("owned-forwarded-card", "Card", CARD);
    assert!(map.is_empty(), "owned: {map:?}");
}

#[test]
fn renamed_destructure_forwarded_under_its_prop_name_is_not_owned() {
    // `{ id: ident }` forwards `ident` as `id`, the declared prop's own name.
    let map = owned_map("owned-forwarded-renamed", "Card", RENAMED);
    assert!(map.is_empty(), "owned: {map:?}");
}

#[test]
fn quoted_key_forwarded_under_its_prop_name_is_not_owned() {
    // The quoted key normalizes to the declared name before it meets the attribute name.
    let map = owned_map("owned-forwarded-quoted", "Tag", QUOTED);
    assert!(map.is_empty(), "owned: {map:?}");
}

#[test]
fn forwarded_style_prop_is_not_owned() {
    // `size={size}` hands a style prop on, so Button no longer shadows it at call sites.
    let map = owned_map("owned-forwarded-style", "Button", STYLE_PROP);
    assert_eq!(map, owned("Button", &["variant"]));
}

#[test]
fn reads_forward_through_wrappers_logic_conditionals_and_arithmetic() {
    // Every attribute carries its own prop's name and reads the local through a different form;
    // only `kept`, read outside any attribute, stays owned.
    let map = owned_map("owned-forwarded-forms", "Forms", FORMS);
    assert_eq!(map, owned("Forms", &["kept"]));
}

#[test]
fn component_target_under_the_same_name_is_not_owned() {
    // `<Icon size={size} />` counts: the name is the same, whatever the element is.
    let map = owned_map("owned-forwarded-component", "Toolbar", COMPONENT_TARGET);
    assert!(map.is_empty(), "owned: {map:?}");
}

#[test]
fn spread_object_literal_naming_the_prop_is_not_owned() {
    // `{ size }`, `{ tone: tone }` and `wide && { wide }` all still carry the prop's name.
    let map = owned_map("owned-forwarded-spread", "Spreads", SPREAD_LITERAL);
    assert_eq!(map, owned("Spreads", &["kept"]));
}

#[test]
fn body_destructure_forwarded_is_not_owned() {
    let map = owned_map("owned-forwarded-body", "Card", BODY_DESTRUCTURE);
    assert!(map.is_empty(), "owned: {map:?}");
}

#[test]
fn arrow_component_forward_is_not_owned() {
    let map = owned_map("owned-forwarded-arrow", "Card", ARROW);
    assert!(map.is_empty(), "owned: {map:?}");
}

#[test]
fn forward_ref_inner_forward_is_not_owned() {
    // The declaration arrives through the generic; the forward subtracts the same way.
    let map = owned_map("owned-forwarded-forward-ref", "Button", FORWARD_REF);
    assert_eq!(map, owned("Button", &["variant"]));
}

#[test]
fn read_only_prop_stays_owned_beside_a_forwarded_one() {
    // `size` is only read (`void size`); `id` reaches an attribute of its own name and drops out.
    let map = owned_map("owned-forwarded-mixed", "Meter", MIXED);
    assert_eq!(map, owned("Meter", &["size"]));
}

#[test]
fn another_attribute_name_keeps_the_prop_owned() {
    // `w={size}` reflects `size` under another name.
    let map = owned_map("owned-forwarded-other-name", "Box", OTHER_NAME);
    assert_eq!(map, owned("Box", &["size"]));
}

#[test]
fn crossed_names_keep_both_props_owned() {
    // The attribute must carry the name of the prop it reads, not just any destructured name.
    let map = owned_map("owned-forwarded-crossed", "Swap", CROSSED);
    assert_eq!(map, owned("Swap", &["size", "width"]));
}

#[test]
fn the_local_name_is_not_the_prop_name() {
    // `ident={ident}` carries the local's name; the prop is `id`, so it is still Card's own.
    let map = owned_map("owned-forwarded-local-name", "Card", LOCAL_NAME);
    assert_eq!(map, owned("Card", &["id"]));
}

#[test]
fn data_attribute_reflection_keeps_the_prop_owned() {
    // The NEO-CHAIN-14 Tile: `data-size={size}` shows `size` in the DOM under another name, so
    // `size` stays Tile's own prop and the owned set is published.
    let map = owned_map("owned-forwarded-mirror", "Tile", DOM_MIRROR);
    assert_eq!(map, owned("Tile", &["label", "size"]));
}

#[test]
fn spread_under_another_name_or_of_a_local_keeps_the_prop_owned() {
    // `{ w: size }` and `{ 'data-size': size }` rename it; `{...extra}` has no literal to read.
    let map = owned_map("owned-forwarded-spread-other", "Mirror", SPREAD_OTHER_NAME);
    assert_eq!(map, owned("Mirror", &["extra", "size"]));
}

#[test]
fn children_keep_the_prop_owned() {
    // `{size}` and `{wide ? size : 'none'}` render in children, which are not attributes.
    let map = owned_map("owned-forwarded-children", "Label", CHILDREN);
    assert_eq!(map, owned("Label", &["size"]));
}

#[test]
fn conditions_keep_the_prop_owned() {
    // `size` only picks a branch of `size={…}`; the value that reaches the element is not `size`.
    let map = owned_map("owned-forwarded-condition", "Pick", CONDITION);
    assert_eq!(map, owned("Pick", &["size"]));
}
