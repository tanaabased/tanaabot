#!/usr/bin/env bun
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

assert.ok(process.argv[2], 'Usage: check-package-cli.js <extracted-package>');
const root = resolve(process.argv[2]);
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const pkg = readJson('package.json');
const codex = readJson('.codex-plugin/plugin.json');
const openclaw = readJson('openclaw.plugin.json');
const entry = (await import(pathToFileURL(resolve(root, 'index.js')).href)).default;

assert.equal(pkg.name, `@tanaab/${codex.name}`);
assert.equal(openclaw.id, codex.name);
assert.equal(entry.id, openclaw.id);
assert.equal(typeof entry.register, 'function');
assert.equal(codex.version, pkg.version);
assert.equal(openclaw.version, pkg.version);
assert.deepEqual(pkg.openclaw.extensions, ['./index.js']);
assert.deepEqual(pkg.openclaw.runtimeExtensions, pkg.openclaw.extensions);
process.stdout.write(`Package identity and entrypoint checks passed: ${pkg.name}@${pkg.version}\n`);
