#!/usr/bin/env bun
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const dependency = resolve(root, 'node_modules/@tanaab/openclaw-agent-system');
const metadata = JSON.parse(await readFile(resolve(dependency, 'package.json'), 'utf8'));
const target = metadata.exports?.['./manifest']?.import;
if (target !== './dist/manifest.js') throw new Error('Unsupported Agent System manifest export.');

// build the upstream manifest entrypoint with its owning build-task.ts settings.
// GIT dependencies omit dist; consumers still import only the public package export.
const result = await globalThis.Bun.build({
  entrypoints: [resolve(dependency, 'manifest/public.ts')],
  outdir: dirname(resolve(dependency, target)),
  target: 'node',
  format: 'esm',
  packages: 'external',
  naming: 'manifest.js',
});
if (!result.success) throw new AggregateError(result.logs, 'Agent System manifest build failed.');
process.stdout.write(
  'Prepared @tanaab/openclaw-agent-system/manifest from the locked Git dependency.\n',
);
