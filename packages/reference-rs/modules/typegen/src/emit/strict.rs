//! Strict-token wrappers around SystemStyleObject. Open emit keeps the
//! `(string & {})` hatch on StyleProps. When `EmitOptions.strict` names known
//! categories, this printer emits `StrictColorProps` / `StrictRadiiProps` /
//! `StrictSpacingProps` and wraps `BaseSystemStyleObject` (`StyleProps`) in
//! declaration order, then intersects nested condition keys so the alias is
//! not circular. Unknown names are skipped; duplicates keep the first
//! occurrence. Spacing is implemented here even though core's spacing wrapper
//! is null. This does not parse `ui.config.ts` and does not invent Panda
//! `rounded*` keys.

use super::ts::quote_literal;
use std::collections::BTreeSet;

const OPEN_SYSTEM_STYLE_OBJECT: &str = r#"export type SystemStyleObject = StyleProps & {
  [K in StyleConditionKey]?: SystemStyleObject;
} & {
  [K in `&${string}`]?: SystemStyleObject;
};
"#;

const WRAPPED_SYSTEM_STYLE_OBJECT_TAIL: &str = r#" & {
  [K in StyleConditionKey]?: SystemStyleObject;
} & {
  [K in `&${string}`]?: SystemStyleObject;
};
"#;

const COLOR_VALUE_PARTS: &[&str] = &[
    "ColorToken",
    "'white'",
    "'black'",
    "'inherit'",
    "'currentColor'",
    "'transparent'",
];

const RADIUS_VALUE_PARTS: &[&str] = &[
    "RadiusToken",
    "'none'",
    "'inherit'",
    "'initial'",
    "'revert'",
];

const SPACING_VALUE_PARTS: &[&str] = &["SpacingToken", "0", "'0'", "'auto'", "'inherit'"];

#[derive(Clone, Copy, PartialEq, Eq)]
pub(super) enum StrictCategory {
    Colors,
    Radii,
    Spacing,
}

pub(super) struct StrictKeys {
    pub colors: BTreeSet<&'static str>,
    pub radii: BTreeSet<&'static str>,
    pub spacing: BTreeSet<&'static str>,
}

struct MappedWrapper<'a> {
    keys_name: &'static str,
    keys: &'a BTreeSet<&'static str>,
    value_name: &'static str,
    value_parts: &'static [&'static str],
    safe_name: &'static str,
    wrapper_name: &'static str,
}

impl StrictCategory {
    fn parse(name: &str) -> Option<Self> {
        match name {
            "colors" => Some(Self::Colors),
            "radii" => Some(Self::Radii),
            "spacing" => Some(Self::Spacing),
            _ => None,
        }
    }

    fn wrapper_name(self) -> &'static str {
        match self {
            Self::Colors => "StrictColorProps",
            Self::Radii => "StrictRadiiProps",
            Self::Spacing => "StrictSpacingProps",
        }
    }
}

impl StrictKeys {
    fn for_category(&self, cat: StrictCategory) -> &BTreeSet<&'static str> {
        match cat {
            StrictCategory::Colors => &self.colors,
            StrictCategory::Radii => &self.radii,
            StrictCategory::Spacing => &self.spacing,
        }
    }
}

pub(super) fn normalize(names: &[String], keys: &StrictKeys) -> Vec<StrictCategory> {
    let mut seen = [false; 3];
    let mut out = Vec::new();
    for name in names {
        let Some(cat) = StrictCategory::parse(name) else {
            continue;
        };
        let idx = cat as usize;
        if seen[idx] || keys.for_category(cat).is_empty() {
            continue;
        }
        seen[idx] = true;
        out.push(cat);
    }
    out
}

pub(super) fn push_system_style_object(
    out: &mut String,
    active: &[StrictCategory],
    keys: &StrictKeys,
) {
    if active.is_empty() {
        out.push_str(OPEN_SYSTEM_STYLE_OBJECT);
        return;
    }
    push_wrappers(out, active, keys);
    out.push_str("export type BaseSystemStyleObject = StyleProps;\n\n");
    out.push_str("export type SystemStyleObject = ");
    out.push_str(&wrap_base(active));
    out.push_str(WRAPPED_SYSTEM_STYLE_OBJECT_TAIL);
}

fn wrap_base(active: &[StrictCategory]) -> String {
    let mut inner = String::from("BaseSystemStyleObject");
    for cat in active {
        inner = format!("{}<{inner}>", cat.wrapper_name());
    }
    inner
}

fn push_wrappers(out: &mut String, active: &[StrictCategory], keys: &StrictKeys) {
    for cat in active {
        push_mapped_wrapper(out, &wrapper_for(*cat, keys));
        out.push('\n');
    }
}

fn wrapper_for(cat: StrictCategory, keys: &StrictKeys) -> MappedWrapper<'_> {
    match cat {
        StrictCategory::Colors => MappedWrapper {
            keys_name: "ColorPropKeys",
            keys: &keys.colors,
            value_name: "StrictColorValue",
            value_parts: COLOR_VALUE_PARTS,
            safe_name: "SafeColorProps",
            wrapper_name: "StrictColorProps",
        },
        StrictCategory::Radii => MappedWrapper {
            keys_name: "RadiiPropKeys",
            keys: &keys.radii,
            value_name: "StrictRadiusValue",
            value_parts: RADIUS_VALUE_PARTS,
            safe_name: "SafeRadiiProps",
            wrapper_name: "StrictRadiiProps",
        },
        StrictCategory::Spacing => MappedWrapper {
            keys_name: "SpacingPropKeys",
            keys: &keys.spacing,
            value_name: "StrictSpacingValue",
            value_parts: SPACING_VALUE_PARTS,
            safe_name: "SafeSpacingProps",
            wrapper_name: "StrictSpacingProps",
        },
    }
}

fn push_mapped_wrapper(out: &mut String, spec: &MappedWrapper<'_>) {
    push_key_union(out, spec.keys_name, spec.keys);
    out.push('\n');
    push_value_union(out, spec.value_name, spec.value_parts);
    out.push('\n');
    out.push_str("export type ");
    out.push_str(spec.safe_name);
    out.push_str(" = {\n  [K in ");
    out.push_str(spec.keys_name);
    out.push_str("]?: StylePropValue<");
    out.push_str(spec.value_name);
    out.push_str(">;\n};\n\n");
    out.push_str("export type ");
    out.push_str(spec.wrapper_name);
    out.push_str("<P> = Omit<P, ");
    out.push_str(spec.keys_name);
    out.push_str("> & ");
    out.push_str(spec.safe_name);
    out.push_str(";\n");
}

fn push_key_union(out: &mut String, name: &str, keys: &BTreeSet<&'static str>) {
    out.push_str("type ");
    out.push_str(name);
    out.push_str(" =\n");
    let mut iter = keys.iter();
    let Some(first) = iter.next() else {
        out.push_str("  never;\n");
        return;
    };
    out.push_str("  | ");
    out.push_str(&quote_literal(first));
    for key in iter {
        out.push_str("\n  | ");
        out.push_str(&quote_literal(key));
    }
    out.push_str(";\n");
}

fn push_value_union(out: &mut String, name: &str, parts: &[&str]) {
    out.push_str("type ");
    out.push_str(name);
    out.push_str(" =\n");
    let mut iter = parts.iter();
    let Some(first) = iter.next() else {
        out.push_str("  never;\n");
        return;
    };
    out.push_str("  | ");
    out.push_str(first);
    for part in iter {
        out.push_str("\n  | ");
        out.push_str(part);
    }
    out.push_str(";\n");
}
