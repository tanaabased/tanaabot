#!/usr/bin/env bun
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import definitions from '../lib/definitions.js';
import automationTargets from '../lib/automation-targets.js';
import { planSync } from '../lib/sync-plan.js';
import syncReport from '../utils/sync-report.js';

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const workspaceDir = input.workspaceDir ?? fileURLToPath(new URL('../../../', import.meta.url));
  const loaded = await definitions(workspaceDir);
  const git = (...args) =>
    execFileSync('git', args, { cwd: workspaceDir, encoding: 'utf8' }).trim();
  const origin = git('remote', 'get-url', 'origin');
  if (
    !/^(?:git@github\.com:|https:\/\/github\.com\/)tanaabased\/tanaabot(?:\.git)?$/.test(origin)
  ) {
    throw new Error('canonical-tanaabot-origin-required');
  }
  const source = {
    revision: git('rev-parse', 'HEAD'),
    dirty: git('status', '--porcelain').length > 0,
  };
  if (input.mode !== undefined && !['targets', 'sync'].includes(input.mode))
    throw new Error('sync-mode-invalid');
  const result =
    input.mode === 'targets'
      ? {
          schema: 'tanaabot.automation-targets/v1',
          source,
          targets: automationTargets(loaded.manifest, input.context, input.id),
        }
      : planSync({
          ...loaded,
          source,
          existingTasks: input.existingTasks,
          context: input.context,
          id: input.id,
          now: new Date().toISOString(),
        });
  process.stdout.write(
    `${JSON.stringify({ ...result, ...(result.operations ? { presentation: syncReport(result, loaded.manifest.debug) } : {}) }, null, 2)}\n`,
  );
} catch (error) {
  process.stderr.write(
    `${JSON.stringify({
      status: 'error',
      code: error.message,
      ...(error.diagnostics ? { diagnostics: error.diagnostics } : {}),
    })}\n`,
  );
  process.exitCode = 1;
}
