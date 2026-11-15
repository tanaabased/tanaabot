import { readFile, realpath } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';

import { loadManifest } from '@tanaab/openclaw-agent-system/manifest';

export default async function definitions(workspaceDir) {
  const root = await realpath(workspaceDir);
  const loaded = await loadManifest({
    workspaceDir: root,
    manifestPath: '.agent-system/agent.yaml',
  });
  if (loaded.status !== 'loaded') {
    const error = new Error(`manifest-${loaded.status}`);
    error.diagnostics = loaded.diagnostics;
    throw error;
  }
  const guidance = await realpath(resolve(root, 'prompts/automations/shared.md'));
  const path = relative(root, guidance);
  if (path === '..' || path.startsWith(`..${sep}`))
    throw new Error('shared-guidance-outside-workspace');
  return { manifest: loaded.manifest, shared: await readFile(guidance, 'utf8') };
}
