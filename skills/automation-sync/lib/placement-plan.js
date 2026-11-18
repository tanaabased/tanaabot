/** Match already-verified bindings to sidebar sections; native controls own moves and readback. */
export default function placementPlan({ manifest, context = {}, id = 'all' }) {
  const jobs = (manifest.automations ?? []).filter(
    (job) => job.runtimes.includes('codex') && (id === 'all' || job.id === id),
  );
  const workers = (context.workers ?? []).filter((worker) =>
    jobs.some((job) => job.id === worker.automationId),
  );
  const placements = workers.map((worker) => {
    const job = jobs.find((job) => job.id === worker.automationId);
    const result = { automationId: job.id, threadId: worker.id, desiredGroup: job.group ?? null };
    const unavailable = (reason) => ({ ...result, status: 'unverified', reason });
    if (!job.group) return { ...result, status: 'skipped', reason: 'no-configured-group' };
    const sidebar = context.sidebar;
    if (!sidebar) return unavailable(context.sidebarUnavailable ?? 'desktop-sidebar-unavailable');
    const threads = [...(sidebar.threads ?? []), ...(sidebar.pinnedThreads ?? [])].filter(
      (thread) => thread.kind === 'codex' && thread.id === result.threadId,
    );
    if (threads.length !== 1 || !threads[0].hostId)
      return unavailable('desktop-chat-missing-or-ambiguous');
    const sections = (sidebar.sections ?? []).filter((section) => section.name === job.group);
    if (sections.length !== 1 || !sections[0].sectionId)
      return unavailable('sidebar-section-missing-or-ambiguous');
    const section = sections[0];
    // Sidebar keys may say local for durable chats. Use them only for membership, never routing.
    const placed = (section.itemKeys ?? []).some(
      (key) =>
        /^codex:thread:[^:]+:/u.test(key) && key.split(':').slice(3).join(':') === result.threadId,
    );
    return {
      ...result,
      status: placed ? 'verified' : 'move',
      ...(placed
        ? {}
        : {
            move: {
              source: 'codex',
              threadId: result.threadId,
              hostId: threads[0].hostId,
              sectionId: section.sectionId,
            },
          }),
    };
  });
  return { schema: 'tanaabot.automation-placement/v1', placements };
}
