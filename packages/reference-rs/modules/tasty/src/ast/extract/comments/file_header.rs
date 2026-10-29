//! File header detection for comment attachment. A comment block that begins the file (only
//! whitespace, a shebang or `'use client'`-style directives before it) and is followed by a blank
//! line documents the file, not the first declaration, so it is withheld from leading-comment lookup.
//! A comment directly above the first declaration with no blank line still attaches.

use oxc_ast::ast::Comment;

/// End offset of the file header comment group, or `None` when the file has no header.
pub(super) fn file_header_end(source: &str, comments: &[Comment]) -> Option<u32> {
    let first = comments.iter().min_by_key(|c| c.span.start)?;
    if !prefix_is_trivia(source.get(..first.span.start as usize)?) {
        return None;
    }
    let mut group_end = first.span.end as usize;
    for comment in sorted_by_start(comments) {
        let start = comment.span.start as usize;
        if start < group_end {
            continue;
        }
        let gap = source.get(group_end..start)?;
        if !gap.trim().is_empty() || has_blank_line(gap) {
            break;
        }
        group_end = comment.span.end as usize;
    }
    let after = source.get(group_end..)?;
    let gap_len = after.len() - after.trim_start().len();
    has_blank_line(&after[..gap_len]).then_some(group_end as u32)
}

fn sorted_by_start(comments: &[Comment]) -> Vec<&Comment> {
    let mut sorted: Vec<&Comment> = comments.iter().collect();
    sorted.sort_by_key(|c| c.span.start);
    sorted
}

fn has_blank_line(gap: &str) -> bool {
    gap.matches('\n').count() >= 2
}

/// True when only whitespace, a shebang or directive prologue lines precede the comment.
fn prefix_is_trivia(prefix: &str) -> bool {
    prefix.lines().map(str::trim).all(|line| {
        line.is_empty() || line.starts_with("#!") || is_directive(line)
    })
}

fn is_directive(line: &str) -> bool {
    let body = line.trim_end_matches(';');
    let quoted = |q: char| body.len() >= 2 && body.starts_with(q) && body.ends_with(q);
    quoted('\'') || quoted('"')
}

#[cfg(test)]
mod tests {
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    use super::file_header_end;

    fn header_end(source: &str) -> Option<u32> {
        let allocator = Allocator::default();
        let parsed = Parser::new(&allocator, source, SourceType::ts()).parse();
        file_header_end(source, &parsed.program.comments)
    }

    #[test]
    fn header_followed_by_blank_line_is_detected() {
        let source = "/** header */\n\ninterface X {}\n";
        assert_eq!(header_end(source), Some(13));
    }

    #[test]
    fn comment_directly_above_declaration_is_not_a_header() {
        assert_eq!(header_end("/** doc */\ninterface X {}\n"), None);
    }

    #[test]
    fn directive_and_shebang_may_precede_header() {
        assert!(header_end("'use client'\n\n/** h */\n\nconst a = 1\n").is_some());
        assert!(header_end("#!/usr/bin/env node\n/** h */\n\nconst a = 1\n").is_some());
    }

    #[test]
    fn code_before_comment_disqualifies_header() {
        assert_eq!(header_end("const a = 1\n\n/** h */\n\nconst b = 2\n"), None);
    }

    #[test]
    fn line_comment_group_forms_one_header() {
        let source = "// one\n// two\n\ninterface X {}\n";
        assert_eq!(header_end(source), Some(13));
    }
}
