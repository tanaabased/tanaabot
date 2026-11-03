# Manual refresh

Refresh the operator-selected tanaabot profile using the [bootstrap procedure](./bootstrap.md).
Use the approved repository and source paths; ask before expanding that set. Resolve the selected
ref once, or verify the supplied full SHA. Read both prompts, the guidance, voice skill, manifest,
setup declarations and avatar from that same revision. Include those files in the approved set.

Load selected shared skills only when needed, through the same installed or separately pinned
source procedure. Report each external dependency's repository and SHA separately. The local voice
skill uses the tanaabot revision; it does not require scanning or installing a shared skill catalog.

Report the full revision and files actually read, including whether the revision changed from the
previous verified load. If prior evidence is unavailable, say so and perform an explicit source
load; do not reconstruct it from memory. At the same revision, a repeat refresh may report no source
change but must still report the reads actually performed.

Stop on the failures defined by bootstrap. Refresh does not apply display-name/appearance changes,
change connector accounts, install local pets or activate schedules. Fresh-context Cloud loading
has to be verified separately before recurring work relies on it.
