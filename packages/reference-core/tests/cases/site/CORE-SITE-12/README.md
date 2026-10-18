# CORE-SITE-12 — unlisted `<Random>` and lowercase `<div color>` are not hosts

The world renders an unlisted `<Random fontSize>` and a lowercase `<div
color>` beside a `<Div mt>` control. The spec checks the sheet carries
only the control utility, neither probe carries a class, and neither paints.

Evidence: ATM-SITE-08; anti-goal in Panda v1 output tests.

> Search terms: unknown element, intrinsic, unregistered, negative case, site/jsx-hosts, CORE-SITE-11
