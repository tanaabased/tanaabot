# appearance synchronization

start with an explicit [bootstrap load](../../prompts/bootstrap.md) using the operator-approved
canonical repository and paths, including this prompt. resolve the selected ref once, or verify the
explicitly selected full SHA, and use that immutable revision for this prompt, guidance, manifest,
appearance asset and any subsequent preview/apply in this run. do not assume a root cloud assistant
or scheduled chat has already loaded the profile.

use this same prompt for manual runs and any later separately approved scheduled runs. after a
complete source load, prepare a read-only preview within the operator's account and inspection scope:

1. inspect the available cloud name/registered-pet tools and current supported state. report
   unsupported or unverified fields. a PNG in this repository is not evidence of an avatar setter.
2. resolve the logical appearance key through a separately verified private binding. keep cloud IDs,
   account bindings and applied-state records outside this public repository. do not assume a
   transient cloud workspace provides durable storage. missing bindings stop the dependent action.
3. show the desired name/appearance, actual supported state and proposed difference, tied to the
   source SHA. if state already agrees, report a no-op without an upload or change. if configuration,
   assets or bindings are invalid or missing, report the problem and make no change.
4. stop at the preview unless the operator separately approves a concrete supported live apply.
   an upload requires its own approval and durable binding so retries cannot duplicate pets.

for an approved live apply, retain the same SHA and previewed inputs, verify the operator-selected
account under the host's identity controls, and use only the approved supported name/pet operation.
read back the result before reporting success or privately recording the applied SHA. if inputs
change, prepare a new preview. recovery uses the previous approved revision through the same
explicit load, preview, approval and readback sequence.

this source definition creates no schedule and grants no ongoing apply authority. live cloud proof,
private durable state, no-op/rollback testing and supported scheduling remain separate work. the
retired [Me #131 pilot](https://github.com/pirog/me/issues/131) supplies historical context only.
this prompt does not activate other review jobs, implement self-sync or replace cloud execution
with a Mac schedule. repository edits alone never expand the operator's authorization.
