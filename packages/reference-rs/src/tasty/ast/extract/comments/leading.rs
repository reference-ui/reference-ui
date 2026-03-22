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

#[cfg(test)]
mod tests {
    use oxc_allocator::Allocator;
    use oxc_ast::ast::Statement;
    use oxc_parser::Parser;
    use oxc_span::{GetSpan, SourceType, Span};

    use super::leading_comment_for_span;
    use super::super::parse_comment_metadata;

    fn nth_top_level_interface_span(body: &[Statement<'_>], index: usize) -> Span {
        let mut seen = 0usize;
        for stmt in body {
            let Statement::TSInterfaceDeclaration(decl) = stmt else {
                continue;
            };
            if seen == index {
                return decl.span();
            }
            seen += 1;
        }
        panic!("expected at least {} top-level interface(s)", index + 1);
    }

    fn metadata_for_nth_interface(source: &str, interface_index: usize) -> super::super::parse::CommentMetadata {
        let allocator = Allocator::default();
        let parsed = Parser::new(&allocator, source, SourceType::ts()).parse();
        let span = nth_top_level_interface_span(&parsed.program.body, interface_index);
        parse_comment_metadata(leading_comment_for_span(
            source,
            &parsed.program.comments,
            span,
            None,
        ))
    }

    #[test]
    fn no_gap_jsdoc_attaches_to_following_interface() {
        let source = "/** doc */\ninterface X {}\n";
        let meta = metadata_for_nth_interface(source, 0);
        assert!(
            meta
                .description_raw
                .as_deref()
                .is_some_and(|t| t.contains("doc")),
            "expected leading comment text, got {:?}",
            meta.description_raw
        );
    }

    #[test]
    fn statement_between_blocks_jsdoc_from_reaching_interface() {
        let source = "/** doc */\nconst y = 1;\ninterface X {}\n";
        let meta = metadata_for_nth_interface(source, 0);
        assert!(
            meta.description_raw.is_none() && meta.description.is_none(),
            "expected no attached comment on X, got {:?} / {:?}",
            meta.description_raw,
            meta.description
        );
    }

    #[test]
    fn consecutive_line_comments_merge_before_interface() {
        let source = "// line 1\n// line 2\ninterface X {}\n";
        let meta = metadata_for_nth_interface(source, 0);
        let raw = meta
            .description_raw
            .as_deref()
            .expect("merged line comments should yield description_raw");
        assert!(raw.contains("line 1"), "raw={raw:?}");
        assert!(raw.contains("line 2"), "raw={raw:?}");
    }

    #[test]
    fn jsdoc_plus_plain_line_merged_and_parsed_as_jsdoc() {
        let source = "/** jsdoc */\n// plain\ninterface X {}\n";
        let meta = metadata_for_nth_interface(source, 0);
        let raw = meta
            .description_raw
            .as_deref()
            .expect("expected merged comment block");
        assert!(raw.contains("jsdoc"), "raw={raw:?}");
        assert!(raw.contains("plain"), "raw={raw:?}");
        assert!(
            meta.jsdoc.is_some(),
            "block includes JSDoc; expected jsdoc metadata, got {:?}",
            meta.jsdoc
        );
    }

    #[test]
    fn empty_jsdoc_block_yields_no_metadata() {
        let source = "/** */\ninterface X {}\n";
        let meta = metadata_for_nth_interface(source, 0);
        assert!(meta.description_raw.is_none());
        assert!(meta.description.is_none());
        assert!(meta.jsdoc.is_none());
    }
}
