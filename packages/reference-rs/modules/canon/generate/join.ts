/**
 * Fail-closed join validation between living Web standards and Reference UI dialects.
 * Verifies element tags, alias targets, class prefix uniqueness, shorthand longhands, and color extensions.
 * Returns descriptive error diagnostics instead of calling process.exit directly to facilitate unit testing.
 * The orchestrator consumes these diagnostics and aborts the build if any check fails.
 */

import { EXTENSION_ALLOWLIST, type DialectData } from './dialect';
import { SHORT_PREFIXES, type ExtensionProp } from './overlay';
import type { PlatformCss } from './platform';

export function isPlatformOrExtension(
  name: string,
  platformCss: PlatformCss,
  extensions: readonly ExtensionProp[] = EXTENSION_ALLOWLIST
): boolean {
  const isPlatform =
    platformCss.properties.has(name) ||
    platformCss.propertyNames.has(name);
  const isDialectExt = extensions.some(
    (ext) => ext.name === name || ext.css === name
  );
  return isPlatform || isDialectExt;
}

export function isDialectColorExtension(
  name: string,
  extensions: readonly ExtensionProp[] = EXTENSION_ALLOWLIST
): boolean {
  return extensions.some(
    (ext) => ext.color && (ext.name === name || ext.css === name)
  );
}

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
  platformCss: PlatformCss,
  extensions: readonly ExtensionProp[] = EXTENSION_ALLOWLIST
): string[] {
  const errors: string[] = [];
  const invalidAliases = dialect.aliases.filter(
    (a) => !isPlatformOrExtension(a.canonical, platformCss, extensions)
  );
  if (invalidAliases.length > 0) {
    errors.push(
      `FAIL: Dialect alias targets not in platform properties or allowlist: ${invalidAliases.map((a) => `${a.alias} -> ${a.canonical}`).join(', ')}`
    );
  }
  return errors;
}

export function validateShortPrefixesJoin(
  platformCssOrDialect: PlatformCss | DialectData,
  platformCssOrPrefixes?: PlatformCss | Record<string, string>,
  prefixes: Record<string, string> = SHORT_PREFIXES,
  extensions: readonly ExtensionProp[] = EXTENSION_ALLOWLIST
): string[] {
  let platformCss: PlatformCss;
  let resolvedPrefixes: Record<string, string>;

  if ('propertyNames' in platformCssOrDialect) {
    platformCss = platformCssOrDialect;
    resolvedPrefixes = (platformCssOrPrefixes as Record<string, string>) ?? prefixes;
  } else {
    platformCss = platformCssOrPrefixes as PlatformCss;
    resolvedPrefixes = prefixes;
  }

  const errors: string[] = [];
  const invalidPrefixes: string[] = [];
  for (const prop of Object.keys(resolvedPrefixes)) {
    if (!isPlatformOrExtension(prop, platformCss, extensions)) {
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
  platformCss: PlatformCss,
  extensions: readonly ExtensionProp[] = EXTENSION_ALLOWLIST
): string[] {
  const errors: string[] = [];
  // NAME is the joined identity; the css emission form must not vouch for the row.
  const unverifiedProps = dialect.canonicalProperties.filter(
    (p) => !isPlatformOrExtension(p.name, platformCss, extensions)
  );
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
  platformCss: PlatformCss,
  extensions: readonly ExtensionProp[] = EXTENSION_ALLOWLIST
): string[] {
  const errors: string[] = [];
  const unverifiedColorProps = dialect.colorProperties.filter((p) => {
    const inWebref = platformCss.colorProperties.has(p);
    const inAllowlist = isDialectColorExtension(p, extensions);
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
