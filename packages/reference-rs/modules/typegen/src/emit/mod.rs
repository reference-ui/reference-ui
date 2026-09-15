//! Assembles the `.d.ts` document from token, recipe, font, and style printers.
//! Takes an indexed `BaseSystem` and concatenates non-empty sections with a
//! blank line between them. Empty systems yield an empty string. Token unions
//! walk known dump categories; recipes print optional variant props and, when
//! the dump has a valid compound row, a compound type whose `when` keys reuse
//! those axis unions. StyleProps and recursive SystemStyleObject print when the
//! dump has color or spacing tokens and declared breakpoints; an empty
//! `FontRegistry {}` is inserted so FontProps cannot collapse StyleProps to
//! `never`. The token catalog omits breakpoints, fonts, and SystemStyleObject.
//! Strict wrappers are printer options, not dump fields.

mod fonts;
mod recipes;
mod strict;
mod style;
mod tokens;
mod ts;

use crate::EmitOptions;
use base_system::BaseSystem;

pub(crate) fn dts(system: &BaseSystem, options: &EmitOptions) -> String {
    let mut out = tokens::token_unions(system);
    push_section(&mut out, &recipes::recipe_types(system));
    let styles = style::style_types(system, options);
    let fonts = fonts::font_registry(system);
    if fonts.is_empty() && !styles.is_empty() {
        push_section(&mut out, fonts::empty_registry());
    } else {
        push_section(&mut out, &fonts);
    }
    push_section(&mut out, &styles);
    out
}

fn push_section(out: &mut String, section: &str) {
    if section.is_empty() {
        return;
    }
    if !out.is_empty() {
        out.push('\n');
    }
    out.push_str(section);
}
