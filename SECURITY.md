# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions of Reference UI:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |
| < 0.0.40| :x:                |

## Reporting a Vulnerability

We take the security of Reference UI and its users seriously. If you believe you have found a security vulnerability in any Reference UI package or repository, please report it to us responsibly.

### How to Report

- **GitHub Private Vulnerability Reporting (Recommended):** Please use GitHub's [Private Vulnerability Reporting](https://github.com/reference-ui/reference-ui/security/advisories/new) feature on this repository.


### What to Include

To help us triage and resolve the issue quickly, please include:
- A description of the issue and the affected package(s) or component(s).
- Step-by-step instructions to reproduce the behavior (proof-of-concept code or test cases).
- Potential impact and attack vectors.
- Any suggestions for mitigation or fixes.

### Response Timeline

- **Assessment & Triage:** We will assess severity and confirm impact within 5 business days.
- **Fix & Disclosure:** We will develop a fix and coordinate disclosure timeline before publishing an advisory.

Please **do not** report security vulnerabilities via public GitHub issues, discussions, or social media.

## Supply Chain & Dependency Security

- All third-party dependencies are pinned or version-constrained.
- CI automated scans run on every pull request and push to ensure dependencies are free of known CVEs.
- GitHub Dependabot and CodeQL static analysis monitor the codebase continuously.
