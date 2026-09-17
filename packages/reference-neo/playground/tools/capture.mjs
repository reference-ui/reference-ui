#!/usr/bin/env node
// Playground capture: sync, serve ephemerally, screenshot routes headless.
// Usage: pnpm playground:capture [route...] [--theme dark|light|both]
// Defaults to every page in dark. Prints each capture path plus any page
// errors the routes threw.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { DIR, listRoutes, startPlayground } from './lib.mjs';

// Routes discovered from src/pages/, mirroring the menu's own glob.
const ROUTES = listRoutes();

const args = process.argv.slice(2);
let themeArg = 'dark';
const themeFlag = args.indexOf('--theme');
if (themeFlag !== -1) {
  themeArg = args[themeFlag + 1] ?? '';
  args.splice(themeFlag, 2);
  if (!['dark', 'light', 'both'].includes(themeArg)) {
    console.error(`unknown theme: ${themeArg} (dark|light|both)`);
    process.exit(1);
  }
}
const themes = themeArg === 'both' ? ['dark', 'light'] : [themeArg];

const routes = args.length > 0 ? args : ROUTES;
for (const route of routes) {
  if (!ROUTES.includes(route)) {
    console.error(`unknown route: ${route} (routes: ${ROUTES.join(' ')})`);
    process.exit(1);
  }
}

const outDir = path.join(DIR, '.captures');
fs.mkdirSync(outDir, { recursive: true });

const { url, close } = await startPlayground({});
const browser = await chromium.launch();
try {
  for (const theme of themes) {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on('pageerror', (err) => errors.push(String(err && err.message ? err.message : err)));
      await page.goto(`${url}?theme=${theme}#/${route}`, { waitUntil: 'load' });
      await page.waitForSelector('#root main', { timeout: 15000 });
      const stamped = await page.evaluate(() => document.documentElement.getAttribute('data-color-mode'));
      if (stamped !== theme) errors.push(`data-color-mode is ${stamped}, wanted ${theme}`);
      // Let once-animations (rise.in) settle so the still shows end state.
      await page.waitForTimeout(800);
      const out = path.join(outDir, `${route}.${theme}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`capture: ${out}`);
      for (const message of errors) console.log(`capture: [${route}.${theme}] page error: ${message}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
  await close();
}
