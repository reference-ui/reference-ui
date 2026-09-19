# ATM-SITE-12

Tagged template literals are not an extract site: the object form is the
only author API, so templates produce no wants and are never parsed as CSS
text. A tag on a live `css` binding emits one located diagnostic per tag
(`tagged template is not a css() site; use css({...})`) — the no-silence
sweep revoked the old "no wants, no diagnostic" note (SPEC-V2-38). A tag on
any other binding (`styled.div`) stays silent.
Contract: [SPEC.md](../../../SPEC.md).
