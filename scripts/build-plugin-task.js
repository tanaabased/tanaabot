import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, '.agents/skills');
const output = join(root, 'skills');

// The repository owns .agents/skills; the plugin contract requires skills/.
await readdir(source);
await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });

async function rebaseLinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const targetFile = join(directory, entry.name);
    if (entry.isDirectory()) {
      await rebaseLinks(targetFile);
    } else if (entry.name.endsWith('.md')) {
      const sourceFile = join(source, relative(output, targetFile));
      const markdown = await readFile(targetFile, 'utf8');
      const rebased = markdown.replace(/\]\((\.[^\s)]*)\)/g, (link, href) => {
        const [path, fragment] = href.split('#');
        const sourceTarget = resolve(dirname(sourceFile), path);
        const internal = relative(source, sourceTarget);
        const target =
          internal === '..' || internal.startsWith(`..${sep}`)
            ? sourceTarget
            : join(output, internal);
        const relocated = relative(dirname(targetFile), target).split(sep).join('/');
        const hrefPath = relocated.startsWith('.') ? relocated : `./${relocated}`;
        return `](${hrefPath}${fragment === undefined ? '' : `#${fragment}`})`;
      });
      await writeFile(targetFile, rebased);
    }
  }
}

await rebaseLinks(output);
