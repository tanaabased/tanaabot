# Update the Cloud Canon plugin

Check and, when appropriate, update only the operator's existing private personal Canon plugin
from stable npm `latest` for `@tanaab/canon`. Use the native **Update Plugin** skill and its required
references, then the supported Plugin Creator tools. Do not build another updater service or use
an unsupported API, browser workaround, local Codex installation, or alternate credentials.

Use the exact backend plugin ID and approved account from the existing private operator binding
supplied to this worker. Keep that binding in native private context, outside repository files.
Do not select a target from a display name, chat title, package name, or search match. If the
binding, account evidence, required tools or approved write scope is unavailable, report the
specific blocker without making a write. Interactive tool availability does not prove scheduled
write access; distinguish catalog presence, successful reads and an actual guarded update.

The repository schedules this automation daily at 1 a.m. `America/New_York`, after midnight
Automation Sync. This automation does not manage schedules or cutover. The operator owns the old
updater. Never run another updater, enable this schedule, pause the old one, change credentials,
recreate the plugin, republish an environment or update other plugins. If another writer or an
unresolved update is observed, reconcile it before any new write; report a blocker if that cannot
be done through the existing workflow.

## Read the installed release

Use `get_plugin_files` for the exact bound backend ID and follow every `next_offset`. Verify the
package namespace is `tanaab`, scope is `USER`, discoverability is `PRIVATE` and the selected
account is authorized to edit this existing plugin. Preserve its identity, ownership, visibility,
sharing and effective configuration. Read the manifests and relevant source using exact paths
from the returned inventory. Retain the current version and observed `current_release_id`; if
the release changes between reads, refresh before preparing an update.

## Resolve and prepare npm latest

1. Resolve `dist-tags.latest` once from `https://registry.npmjs.org/@tanaab%2fcanon`. Retain that
   registry document, exact version, tarball URL, `dist.integrity` and optional `dist.shasum`
   for this run. The exact published npm release is authoritative; never substitute GitHub
   `main`, another tag or another version.
2. Parse strict SemVer and compare precedence correctly. Accept only a stable release. A
   prerelease, invalid version, downgrade or equal-precedence version with different build
   metadata produces no write and a discrepancy report. If versions match exactly, confirm
   the saved version and inventory and report already current. Do not download, re-upload or
   bump an equal version; a no-op is not an update test.
3. For a newer stable release, download only that tarball into temporary Cloud storage. Verify
   its bytes against SRI using the strongest supported algorithm and verify `dist.shasum` when
   present. Reject missing or unsupported integrity, mismatches, unsafe archive paths and
   symlinks before extraction. Do not execute package lifecycle, install, setup or publish
   scripts. Verify npm name/version and plugin namespace/version against the selected release.
4. Follow Update Plugin's package-format and archive requirements. Strip npm's outer `package/`
   wrapper and preserve all skill instructions, names, scripts, references, metadata, templates,
   tests, fixtures and required resources byte-for-byte. Do not discard functional components
   to make an import pass. Omit unrelated packaging material only after checking dependencies.
5. For legacy `.codex-plugin/plugin.json` source, retain it and produce a root `plugin.json`
   using the supported account format. Copy portable identity fields and the complete OpenAI
   interface into `extensions.com.openai.interface`, preserving every `defaultPrompt` value,
   its type and ordering. Synchronize both manifests to the exact npm version and preserve the
   published display name and bundled icon declarations. Retain existing account-attributed
   author/developer values. Use `Developer Tools` for unsupported `Tanaab-based` category and
   `Tanaab canon and workflows` for the account subtitle. Omit `.mcp.json` and its declaration
   only when the source MCP map is empty. Preserve functional integrations using supported
   format; report unsupported structural changes instead of guessing. For portable upstream
   source, preserve its effective configuration without unnecessary legacy conversion.
6. Validate JSON/YAML, skill name/description uniqueness, component discovery and referenced
   assets through the existing package owners. Compare the intended full inventory with the
   current saved inventory. Classify removed or renamed package-owned files against the
   previously installed exact npm release and its known account adaptations. Preserve unrelated
   user-added files. If ownership is uncertain, report the ambiguity instead of deleting them.

## Update and read back

Uploads overlay existing files: omitted files survive. Collect every obsolete package-owned
file as an exact plugin-root-relative path from the current inventory and pass it in
`delete_paths`. Update references in the same archive, omit deleted files from the archive and
never upload and delete the same path. Do not delete generated compatibility files while their
owning declarations remain. Historical provider-managed releases are not current package files
and are never deletion targets. If the available tool lacks deletion support, report the blocker
instead of uploading a replacement that retains obsolete skills or references.

Call `update_plugin` with the exact bound `plugin_id`, the prepared archive's absolute path,
the observed `current_release_id` as `expected_release_id`, and exact `delete_paths`. An
unchanged version may be automatically bumped by the provider, so never use an equal-version
upload to test access. On a release conflict, reread and reconcile the current source and rebuild
before a legitimate retry. Reconcile an uncertain outcome against the original release and
intended files before another write. Stop on an account mismatch or denial; never switch accounts
or repeat a denied action.

After success, read back version, release ID, `USER`/`PRIVATE` state and the complete paginated
inventory. Verify expected skill names, removed paths and updated references. Use the supported
archive reader when binary or complete byte verification is needed; compare saved instructions
and resources with the prepared package. Permit only semantically equivalent importer
normalization of compatibility JSON. Inspect import diagnostics when available. An update
response alone does not establish the saved file inventory. Report unavailable or mismatched
readback as incomplete without blindly publishing again.

## Result and dot summary

Report every invocation, including unchanged, blocked and failed runs. The shared presentation
partial owns quoting, spacing, status severity, links and delivery. This prompt owns the Canon
result fields and wording in both cards below. Return the full result here in the reusable worker
and the compact summary to the owning coordinator for its normal main-chat delivery. Do not send
another report yourself. The layouts below are templates, not evidence of a completed run; replace
every placeholder with verified results.

### Full worker result

Use one of these detailed headings:

- `## ⬇️ UPDATE CLOUD CANON · UPDATED` after a verified update and readback.
- `## ⬇️ UPDATE CLOUD CANON · UNCHANGED` after an exact version match.
- `## ⚠️ UPDATE CLOUD CANON · INCOMPLETE` for a blocker or unverified outcome.
- `## ❌ UPDATE CLOUD CANON · FAILED` for an observed failed operation.

Include Release (previous → saved version, or unchanged version), Package, Account update and
Verification rows. Use passed, failed, unverified or not needed accurately. For an unchanged run,
Package and Account update are not needed. After an update, include the returned plugin link and
saved release ID. For an incomplete or failed run, preserve useful results and give one concrete
next step without credentials or raw diagnostics. Distinguish a real release update from a no-op,
and saved-package verification from runtime behavior, icon rendering and skill discovery in a
fresh Cloud chat. Do not claim those separately untested outcomes or close Canon #110.

Use this layout, including the optional lines only when applicable:

> ## ⬇️ UPDATE CLOUD CANON · <OUTCOME>
>
> **Release:** <Previous → verified saved version, or unchanged version.>
> **Package:** <Passed / failed / unverified / not needed, with a brief reason if needed.>
> **Account update:** <Passed / failed / unverified / not needed.>
> **Verification:** <Passed / failed / unverified; useful inventory or removal result.>
>
> <Brief description of what changed or why no update was needed.>
>
> [View Canon](plugin-url)
> **Saved release:** <Returned release ID; after an update.>
>
> **Next step:** <Exactly one action; incomplete/failed runs only.>
>
> <Contextual final status: ✅ verified outcome, ⚠️ incomplete outcome, or ❌ failed operation.>

Use a success line such as “✅ Canon updated and read back” or “✅ Canon already current; no
changes made.” For incomplete or failed results, the final status names the actual unresolved
outcome and never implies that the update or readback passed. Keep diagnostics in the shared
optional Debug card; do not repeat them in successful rows.

### Summary for tanaabot's main chat

Use the shared compact-card layout with this automation's title and outcome:

> **⬇️ UPDATE CLOUD CANON**
>
> <Canon updated from X to Y, already current at X, or a concise blocker/failure and useful next action.>
>
> [Go to chat →](worker-url)
>
> <Exactly one contextual final status: ✅ verified outcome, ⚠️ incomplete outcome, or ❌ failed operation.>

The summary must say whether the operator needs to act. Keep detailed inventory and verification
rows in the worker; do not duplicate its full card in the main chat. Include the verified worker
link only when available and follow the shared navigation fallback otherwise. Respect native
delivery and report missing delivery capability rather than imitating success. Do not suppress
unchanged reports or change the schedule after a successful, unchanged, blocked or failed run.
