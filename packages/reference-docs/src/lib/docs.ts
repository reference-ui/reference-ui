import React from 'react';

/** All docs with frontmatter — each MDX exports { default, frontmatter } */
const docModules = import.meta.glob<{
  default: React.ComponentType;
  frontmatter: { title: string; section: string; order: number; slug: string };
}>('../docs/**/*.mdx', { eager: true });

export type DocMeta = {
  title: string;
  section: string;
  order: number;
  slug: string;
  path: string;
};

/** Docs sorted by section, then order */
export const docs = Object.entries(docModules)
  .map(([path, mod]) => ({ ...mod!.frontmatter, path }))
  .sort((a, b) => a.section.localeCompare(b.section) || a.order - b.order);

/** Docs grouped by section for nav */
export const docsBySection = docs.reduce(
  (acc, doc) => {
    if (!acc[doc.section]) acc[doc.section] = [];
    acc[doc.section].push(doc);
    return acc;
  },
  {} as Record<string, DocMeta[]>
);

/** Slug → module for route resolution */
export const slugToModule = Object.fromEntries(
  docs.map((d) => [d.slug, docModules[d.path]])
);
