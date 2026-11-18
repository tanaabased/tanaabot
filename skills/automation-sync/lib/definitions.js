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
  const partials = {};
  for (const name of ['metadata', 'execution', 'presentation', 'dispatch', 'request']) {
    const file = await realpath(resolve(root, `prompts/${name}-partial.md`));
    const path = relative(root, file);
    if (path === '..' || path.startsWith(`..${sep}`))
      throw new Error('shared-guidance-outside-workspace');
    partials[name] = await readFile(file, 'utf8');
  }
  const requestsFile = await realpath(resolve(root, 'prompts/requests.json'));
  const requestsPath = relative(root, requestsFile);
  if (requestsPath === '..' || requestsPath.startsWith(`..${sep}`))
    throw new Error('shared-guidance-outside-workspace');
  const requests = JSON.parse(await readFile(requestsFile, 'utf8'));
  return { manifest: loaded.manifest, partials, requests };
}
