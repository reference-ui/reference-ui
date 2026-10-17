//! Formatting of collected global rules into indented CSS blocks.
//! `format_global_rules` prints each `(wraps, selector)` block inside its at-rule wraps and skips blocks with no declarations.
//! `write_decls` prints the declaration lines of one block at the block's depth.

use super::RuleBlocks;

/// Format collected global rules into indented CSS blocks.
pub fn format_global_rules(
    rules: &RuleBlocks,
    out: &mut String,
) {
    for ((wraps, selector), decls) in rules {
        if decls.is_empty() {
            continue;
        }
        for (depth, query) in wraps.iter().enumerate() {
            push_indent(out, depth + 1);
            out.push_str(query);
            out.push_str(" {\n");
        }
        push_indent(out, wraps.len() + 1);
        out.push_str(selector);
        out.push_str(" { ");
        write_decls(out, decls);
        out.push_str(" }\n");
        for depth in (0..wraps.len()).rev() {
            push_indent(out, depth + 1);
            out.push_str("}\n");
        }
    }
}

fn push_indent(out: &mut String, depth: usize) {
    for _ in 0..depth {
        out.push_str("  ");
    }
}

fn write_decls(out: &mut String, decls: &[(String, String)]) {
    for (i, (prop, val)) in decls.iter().enumerate() {
        if i > 0 {
            out.push_str("; ");
        }
        out.push_str(prop);
        out.push_str(": ");
        out.push_str(val);
    }
}
