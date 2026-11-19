/** render the shared worker opening from each automation's authored presentation. */
export default function requestHeader(template, title, presentation) {
  const fields = {
    emoji: presentation?.emoji,
    title: title?.toUpperCase(),
    request: presentation?.request,
  };
  for (const [name, value] of Object.entries(fields)) {
    const limit = name === 'emoji' ? 16 : name === 'title' ? 200 : 280;
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.length > limit ||
      /[\r\n<>]/u.test(value)
    )
      throw new Error(`request-header-field-invalid:${name}`);
  }
  if (typeof template !== 'string' || !template.trim())
    throw new Error('shared-partial-required:request');
  for (const name of Object.keys(fields)) {
    if (template.split(`{{${name}}}`).length !== 2)
      throw new Error(`request-header-slot-invalid:${name}`);
  }
  const header = template
    .trim()
    .replace(/\{\{(emoji|title|request)\}\}/gu, (_, name) => fields[name].trim());
  if (header.includes('{{')) throw new Error('request-header-slot-invalid');
  return header;
}
