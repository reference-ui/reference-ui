/**
 * Deep-merge nested token trees from the six `tokens()` call sites.
 * Categories merge by key; a duplicate leaf path with a different value is a
 * hard error. Mode leaves match spec.rs: `{ value | light | dark }` strings, so
 * a token *named* `light` whose value is itself `{ light, dark }` stays a group.
 * Keyframe tables merge by animation name; duplicate names with different steps
 * fail. Leaf-shape counts are for the generator log, not a hardcoded contract.
 */

import { fail, type JsonObject, type JsonValue } from './parse';

export type LeafShapes = {
  total: number;
  value: number;
  lightDark: number;
  valueDark: number;
  valueLight: number;
  lightOnly: number;
  darkOnly: number;
  allThree: number;
};

export function mergeTokenTrees(trees: JsonObject[]): JsonObject {
  let acc: JsonObject = {};
  for (const tree of trees) {
    acc = mergeObjects('', acc, tree);
  }
  return acc;
}

export function mergeKeyframeTables(tables: JsonObject[]): JsonObject {
  const out: JsonObject = {};
  for (const table of tables) {
    for (const [name, steps] of Object.entries(table)) {
      assignKeyframe(out, name, steps);
    }
  }
  return out;
}

export function countLeaves(tree: JsonObject): LeafShapes {
  const shapes: LeafShapes = {
    total: 0,
    value: 0,
    lightDark: 0,
    valueDark: 0,
    valueLight: 0,
    lightOnly: 0,
    darkOnly: 0,
    allThree: 0,
  };
  walkLeaves(tree, shapes);
  return shapes;
}

export function isModeLeaf(value: JsonValue): boolean {
  if (typeof value === 'string') {
    return false;
  }
  const hasSlot = 'value' in value || 'light' in value || 'dark' in value;
  return hasSlot && !isPlainObject(value.light) && !isPlainObject(value.dark);
}

function mergeObjects(path: string, left: JsonObject, right: JsonObject): JsonObject {
  const out: JsonObject = { ...left };
  for (const [key, rightValue] of Object.entries(right)) {
    const child = path ? `${path}.${key}` : key;
    const leftValue = out[key];
    if (leftValue === undefined) {
      out[key] = rightValue;
      continue;
    }
    out[key] = mergeValues(child, leftValue, rightValue);
  }
  return out;
}

function mergeValues(path: string, left: JsonValue, right: JsonValue): JsonValue {
  if (isModeLeaf(left) && isModeLeaf(right)) {
    if (JSON.stringify(left) === JSON.stringify(right)) {
      return left;
    }
    fail(`duplicate token path ${path} with different values`);
  }
  if (isModeLeaf(left) || isModeLeaf(right) || typeof left === 'string' || typeof right === 'string') {
    fail(`cannot merge leaf and group at ${path}`);
  }
  return mergeObjects(path, left, right);
}

function walkLeaves(node: JsonValue, shapes: LeafShapes): void {
  if (typeof node === 'string') {
    return;
  }
  if (isModeLeaf(node)) {
    shapes.total += 1;
    classifyLeaf(node, shapes);
    return;
  }
  for (const child of Object.values(node)) {
    walkLeaves(child, shapes);
  }
}

function classifyLeaf(leaf: JsonObject, shapes: LeafShapes): void {
  const shape = ['value', 'light', 'dark'].filter((key) => key in leaf).join('+');
  incrementShape(shape, shapes);
}

function incrementShape(shape: string, shapes: LeafShapes): void {
  if (shape === 'value+light+dark') {
    shapes.allThree += 1;
    return;
  }
  if (shape === 'value+light') {
    shapes.valueLight += 1;
    return;
  }
  if (shape === 'value+dark') {
    shapes.valueDark += 1;
    return;
  }
  if (shape === 'light+dark') {
    shapes.lightDark += 1;
    return;
  }
  incrementSingleSlot(shape, shapes);
}

function incrementSingleSlot(shape: string, shapes: LeafShapes): void {
  if (shape === 'value') {
    shapes.value += 1;
    return;
  }
  if (shape === 'light') {
    shapes.lightOnly += 1;
    return;
  }
  if (shape === 'dark') {
    shapes.darkOnly += 1;
  }
}

function assignKeyframe(out: JsonObject, name: string, steps: JsonValue): void {
  const existing = out[name];
  if (existing === undefined) {
    out[name] = steps;
    return;
  }
  if (JSON.stringify(existing) === JSON.stringify(steps)) {
    return;
  }
  fail(`duplicate keyframe ${name} with different steps`);
}

function isPlainObject(value: JsonValue | undefined): boolean {
  return value !== undefined && typeof value === 'object';
}
