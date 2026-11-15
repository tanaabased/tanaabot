function text(value) {
  return String(value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/([\\`*_{}[\]<>])/g, '\\$1');
}

export default function syncReport(result, debug = false) {
  const rows = result.operations;
  const lines = [
    '## 🔄 Automation synchronization',
    '',
    'Prepared actions for native controls; no schedules have been saved.',
    '',
    ...rows.map((row) => `- **${text(row.automationId)}:** ${text(row.kind)}`),
  ];
  if (!rows.length) lines.push('- No selected automation definitions.');
  const quote = (content) => content.map((line) => (line ? `> ${line}` : '>')).join('\n');
  const cards = [quote(lines)];
  if (debug)
    cards.push(
      quote([
        '## 🔬 Debug',
        '',
        `- Revision: ${text(result.source.revision)}`,
        `- Uncommitted source changes: ${result.source.dirty}`,
      ]),
    );
  return cards.join('\n\n');
}
