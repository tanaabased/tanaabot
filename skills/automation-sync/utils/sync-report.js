function text(value) {
  return String(value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/([\\`*_{}[\]<>])/g, '\\$1');
}

export default function syncReport(result, debug = false) {
  if (!debug) return '';
  const rows = result.operations;
  const lines = [
    '## 🔬 DEBUG · SYNCHRONIZATION PREPARATION',
    '',
    'Prepared actions for native controls; no schedules have been saved.',
    '',
    ...rows.map((row) => `- **${text(row.automationId)}:** ${text(row.kind)}`),
    '',
    `- Sync revision: ${text(result.source.revision)}`,
    ...(result.source.installedRevision
      ? [`- Installed revision: ${text(result.source.installedRevision)}`]
      : []),
    `- Uncommitted source changes: ${result.source.dirty}`,
  ];
  if (!rows.length) lines.push('- No selected automation definitions.');
  const quote = (content) => content.map((line) => (line ? `> ${line}` : '>')).join('\n');
  return quote(lines);
}
