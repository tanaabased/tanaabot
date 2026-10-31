# manual refresh

refresh the operator-selected tanaabot profile using the [bootstrap procedure](./bootstrap.md).
use the currently approved canonical repository and source paths within their authorized scope;
ask before expanding that set. resolve the selected ref once for this run, or verify the explicitly
selected full SHA, and read this refresh prompt, bootstrap, guidance, manifest and appearance asset
at that immutable revision. include both prompts in the approved set.

load selected shared skills only when needed, through the same installed or separately pinned
source procedure. report each dependency repository and SHA separately; there is no local shared
skills directory to list.

report the full revision and files actually read, including whether the revision changed from the
previous verified load. if prior evidence is unavailable, say so and perform an explicit source
load; do not reconstruct it from memory. at the same revision, a repeat refresh may report no source
change but must still report the reads actually performed.

stop on the failures defined by bootstrap. refresh does not apply display-name/appearance changes,
change connector accounts, install local pets or activate schedules. fresh-context cloud loading
has to be verified separately before recurring work relies on it.
