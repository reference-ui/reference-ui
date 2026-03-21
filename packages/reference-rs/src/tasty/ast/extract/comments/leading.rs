//! Leading comment extraction and normalization for JSDoc and block comments.

use oxc_ast::ast::Comment;
use oxc_span::Span;

#[derive(Debug, Clone)]
pub(crate) struct LeadingComment {
    pub(crate) normalized_text: String,
    pub(crate) is_jsdoc: bool,
}

pub(crate) fn leading_comment_for_span(
    source: &str,
    comments: &[Comment],
    node_span: Span,
    exclude_starts_between: Option<&[u32]>,
) -> Option<LeadingComment> {
    let node_start = node_span.start;
    let mut candidates: Vec<&Comment> = comments
        .iter()
        .filter(|c| c.span.end <= node_start)
        .collect();
    if candidates.is_empty() {
        return None;
    }
    candidates.sort_by_key(|c| std::cmp::Reverse(c.span.end));

    let first = candidates.first()?;
    if !leading_block_is_usable(source, first, node_start, exclude_starts_between) {
        return None;
    }

    let (block_start, is_jsdoc) =
        collect_leading_comment_block(source, candidates.as_slice(), first);
    let raw = source.get(block_start..first.span.end as usize)?;
    build_leading_comment(raw, is_jsdoc)
}

fn leading_block_is_usable(
    source: &str,
    first: &Comment,
    node_start: u32,
    exclude_starts_between: Option<&[u32]>,
) -> bool {
    !should_exclude_leading_comment(exclude_starts_between, first.span.end, node_start)
        && is_contiguous_comment_gap(source, first.span.end as usize, node_start as usize)
}

fn should_exclude_leading_comment(
    exclude_starts_between: Option<&[u32]>,
    block_end: u32,
    node_start: u32,
) -> bool {
    let Some(exclude) = exclude_starts_between else {
        return false;
    };
    exclude
        .iter()
        .any(|&start| start > block_end && start < node_start)
}

fn collect_leading_comment_block(
    source: &str,
    comments_by_end: &[&Comment],
    first: &Comment,
) -> (usize, bool) {
    let mut block_start = first.span.start as usize;
    let mut is_jsdoc = first.is_jsdoc();

    for comment in comments_by_end.iter().skip(1) {
        let comment_end = comment.span.end as usize;
        if !is_contiguous_comment_gap(source, comment_end, block_start) {
            break;
        }

        block_start = comment.span.start as usize;
        is_jsdoc |= comment.is_jsdoc();
    }

    (block_start, is_jsdoc)
}

fn is_contiguous_comment_gap(source: &str, comment_end: usize, block_start: usize) -> bool {
    let gap = source.get(comment_end..block_start).unwrap_or("");
    comment_end <= block_start && gap.trim().is_empty()
}

fn build_leading_comment(raw: &str, is_jsdoc: bool) -> Option<LeadingComment> {
    let normalized = normalize_comment_text(raw);
    if normalized.is_empty() {
        return None;
    }
    Some(LeadingComment {
        normalized_text: normalized,
        is_jsdoc,
    })
}

fn normalize_comment_text(raw: &str) -> String {
    let stripped = strip_block_comment_delimiters(raw);
    let mut out = String::with_capacity(raw.len());
    let mut first = true;
    for line in stripped.lines() {
        if !first {
            out.push('\n');
        }
        first = false;
        out.push_str(&normalize_comment_line(line));
    }
    out.trim().to_string()
}

fn strip_block_comment_delimiters(raw: &str) -> &str {
    let s = raw.trim();
    let after_open = strip_block_open(s);
    strip_block_close(after_open)
}

fn strip_block_open(s: &str) -> &str {
    if let Some(rest) = s.strip_prefix("/**") {
        rest.trim_start()
    } else if let Some(rest) = s.strip_prefix("/*") {
        rest.trim_start()
    } else {
        s
    }
}

fn strip_block_close(s: &str) -> &str {
    s.strip_suffix("*/").map(|t| t.trim_end()).unwrap_or(s)
}

fn normalize_comment_line(line: &str) -> String {
    let trimmed = line.trim_start();
    if let Some(rest) = trimmed.strip_prefix("//") {
        return rest.trim_start().to_string();
    }
    if let Some(rest) = trimmed.strip_prefix('*') {
        return rest.trim_start().to_string();
    }
    trimmed.to_string()
}
