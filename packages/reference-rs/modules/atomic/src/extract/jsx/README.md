# Extract / jsx

Finds StyleProps on JSX opening tags and hands each value to
`extract/expressions`.

```tsx
<Div mt="2r" bg={on ? 'n300' : 'n100'} _hover={{ color: 'red' }} />
```

String attrs, expression containers, boolean props, spreads, `r={{…}}`,
and a `css={…}` attr are all JSX. Styletrace should eventually gate
which tags are StyleProps (SITE-08). Today every opening tag is scanned.

## Must not

- Choose values (expressions).
- Guess primitives by PascalCase.
- Reimplement wrapper tracing — that is styletrace.
