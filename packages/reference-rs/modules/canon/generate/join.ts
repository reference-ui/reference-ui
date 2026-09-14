/**
 * Fail-closed join validation between living Web standards and Reference UI dialects.
 * Verifies element tags, alias targets, class prefix uniqueness, shorthand longhands, and color extensions.
 * Returns descriptive error diagnostics instead of calling process.exit directly to facilitate unit testing.
 * The orchestrator consumes these diagnostics and aborts the build if any check fails.
 */

import type { DialectData } from './dialect';
import { camelToKebab, type PlatformCss } from './platform';

export function validateElementsJoin(
  dialect: DialectData,
  platformElements: Set<string>
): string[] {
  const errors: string[] = [];
  const invalidTags = dialect.elements.filter(
    (el) => !platformElements.has(el.html.toLowerCase())
  );
  if (invalidTags.length > 0) {
    errors.push(
      `FAIL: Dialect HTML/SVG tags not found in web standards (@webref): ${invalidTags.map((t) => t.html).join(', ')}`
    );
  }
  return errors;
}

export function validateAliasTargetsJoin(
  dialect: DialectData,
  platformCss: PlatformCss
): string[] {
  const errors: string[] = [];
  const invalidAliases = dialect.aliases.filter((a) => {
    const isPlatform =
      platformCss.properties.has(a.canonical) ||
      platformCss.propertyNames.has(a.canonical);
    const isDialectExt =
      dialect.dialectCssAllowlist.has(a.canonical) ||
      dialect.dialectCssAllowlist.has(camelToKebab(a.canonical));
    return !isPlatform && !isDialectExt;
  });
  if (invalidAliases.length > 0) {
    errors.push(
      `FAIL: Dialect alias targets not in platform properties or allowlist: ${invalidAliases.map((a) => `${a.alias} -> ${a.canonical}`).join(', ')}`
    );
  }
  return errors;
}

export function validateShortPrefixesJoin(
  dialect: DialectData,
  platformCss: PlatformCss
): string[] {
  const errors: string[] = [];
  const invalidPrefixes: string[] = [];
  for (const prop of dialect.dialectShortPrefixes.keys()) {
    const isPlatform =
      platformCss.properties.has(prop) ||
      platformCss.propertyNames.has(prop);
    const isDialectExt =
      dialect.dialectCssAllowlist.has(prop) ||
      dialect.dialectCssAllowlist.has(camelToKebab(prop));
    if (!isPlatform && !isDialectExt) {
      invalidPrefixes.push(prop);
    }
  }
  if (invalidPrefixes.length > 0) {
    errors.push(
      `FAIL: Dialect short prefix properties not in platform properties or allowlist: ${invalidPrefixes.join(', ')}`
    );
  }
  return errors;
}

export function validateDialectExtJoin(
  dialect: DialectData,
  platformCss: PlatformCss
): string[] {
  const errors: string[] = [];
  const unverifiedProps = dialect.canonicalProperties.filter((p) => {
    const isPlatform =
      platformCss.properties.has(p.name) ||
      platformCss.propertyNames.has(p.name) ||
      platformCss.propertyNames.has(p.css);
    const isDialectExt =
      dialect.dialectCssAllowlist.has(p.css) ||
      dialect.dialectCssAllowlist.has(p.name);
    return !isPlatform && !isDialectExt;
  });
  if (unverifiedProps.length > 0) {
    errors.push(
      `FAIL: Canonical properties not in webref or dialect allowlist: ${unverifiedProps.map((p) => p.name).join(', ')}`
    );
  }
  return errors;
}

export function validateShorthandsJoin(
  dialect: DialectData,
  platformCss: PlatformCss
): string[] {
  const errors: string[] = [];
  for (const [sh, webrefLonghands] of platformCss.nativeShorthands.entries()) {
    const prop = dialect.canonicalProperties.find((p) => p.name === sh);
    if (prop) {
      const dL = prop.longhands.slice().sort();
      const wL = webrefLonghands.slice().sort();
      if (JSON.stringify(dL) !== JSON.stringify(wL)) {
        errors.push(
          `FAIL: Mismatched native shorthand longhands for '${sh}': dialect=[${dL.join(', ')}] vs webref=[${wL.join(', ')}]`
        );
      }
    }
  }
  return errors;
}

export function validateColorPropsJoin(
  dialect: DialectData,
  platformCss: PlatformCss
): string[] {
  const errors: string[] = [];
  const unverifiedColorProps = dialect.colorProperties.filter((p) => {
    const inWebref = platformCss.colorProperties.has(p);
    const inAllowlist = dialect.dialectColorAllowlist.has(p);
    return !inWebref && !inAllowlist;
  });
  if (unverifiedColorProps.length > 0) {
    errors.push(
      `FAIL: Color properties not in webref or dialect color allowlist: ${unverifiedColorProps.join(', ')}`
    );
  }
  return errors;
}

export function validateClassPrefixesJoin(dialect: DialectData): string[] {
  const errors: string[] = [];
  const prefixOwners = new Map<string, string[]>();
  for (const prop of dialect.canonicalProperties) {
    const owners = prefixOwners.get(prop.classPrefix);
    if (owners) {
      owners.push(prop.name);
    } else {
      prefixOwners.set(prop.classPrefix, [prop.name]);
    }
  }

  for (const [prefix, owners] of prefixOwners.entries()) {
    if (owners.length > 1) {
      errors.push(
        `FAIL: Duplicate class_prefix '${prefix}' shared by: ${owners.join(', ')}`
      );
    }
  }
  return errors;
}

export function validateJoin(
  dialect: DialectData,
  platformElements: Set<string>,
  platformCss: PlatformCss
): string[] {
  return [
    ...validateElementsJoin(dialect, platformElements),
    ...validateAliasTargetsJoin(dialect, platformCss),
    ...validateShortPrefixesJoin(dialect, platformCss),
    ...validateDialectExtJoin(dialect, platformCss),
    ...validateShorthandsJoin(dialect, platformCss),
    ...validateColorPropsJoin(dialect, platformCss),
    ...validateClassPrefixesJoin(dialect),
  ];
}
