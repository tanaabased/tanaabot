---
name: tanaabot-startup-check
description: Verify a prepared Tanaabot Cloud environment and explicitly load its local skill metadata without changing files or settings. Use as its direct-path Start skill, during onboarding or for a requested startup health check.
license: MIT
metadata:
  type: generic
  owner: tanaab
  tags:
    - tanaab
    - generic
    - environment
  openclaw:
    emoji: '🩺'
    homepage: https://github.com/tanaabased/tanaabot/tree/main/skills/startup-check
---

# Tanaabot Startup Check

## Overview

Check the prepared Tanaabot Cloud environment and installed dotfiles, explicitly load local Tanaabot
skill metadata into this chat, and check Canon's separate catalog availability.
Verification never provisions, upgrades, switches revisions, binds Agent System or activates schedules.

## Required Reading

- **Always:** Read and apply [Tanaboot CLI options](../../TANABOOT.md#cli-options) for check behavior and limits.
- **When available in the task catalog:** Read Canon's `tanaab-plugin-info` skill from that catalog
  before obtaining Canon metadata.
- **Before continuing a fresh Cloud task:** Read and apply the installed
  [global guidance](../../dotfiles/ai/.codex/AGENTS.md) after verifying its link in step 3.
- **Before reporting:** Read and apply [Tanaabot Voice](../voice/SKILL.md).
- **Before assigning results or composing the card:** Read and apply the
  [startup report contract](./references/startup-report.md).
- **Before checking private networking:** Read the Networking and VPN references from the
  available Cloud Environment Runtime skill.

## When to Use

- Starting a fresh task in a prepared Tanaabot Cloud environment through its Start skill.
- An explicit request to verify an existing Tanaabot Cloud installation.
- A request for the startup status report, including “show details.”

## When Not to Use

Installation, repair, updates, publishing an environment or proving a safe setup rerun. Those need
separate operator-authorized scope. This skill inspects the saved installation only.

## Workflow

1. Establish the prepared Tanaabot source checkout from the absolute startup path supplied by the
   environment's Start skill, the host's environment context or the resolved target of
   `~/.codex/AGENTS.md`, which agent setup links to
   `dotfiles/ai/.codex/AGENTS.md`. Verify the source belongs to `tanaabased/tanaabot` and record its
   full commit. Do not assume the task's working directory or an optional plugin cache is the prepared
   checkout. If no source can be established, report that check as unverified; do not fetch a replacement.
   Select the optional status report from the operator's or invoking approved automation's request and the prepared checkout's
   top-level `debug` boolean in `.agent-system/agent.yaml`. An explicit request always selects
   the ℹ️ report. Otherwise only literal `true` selects the 🔬 report. Default to the startup
   card alone if the setting is missing or unavailable.
2. Record the task tool's actual shell and command-launch flags. Run
   `bash <prepared-checkout>/tanaboot.sh --check` through that same launcher, without first sourcing
   shell initialization or changing PATH. The command checks declared tools, fresh shells and readable
   configuration offline, including private environment file safety and equality with the actual
   exported environment. The variable names come from that file, not a fixed checklist. Preserve its
   exit status and safe diagnostics. It does not inspect the container's plugin registry or require
   maintenance permissions.
3. Assign Environment, Dependencies and Dotfiles results using the report contract. For the active
   dotpackages, also verify that Stow destinations link to the expected prepared source files; a
   matching copy alone does not prove correct Stow installation. The installed global `AGENTS.md`
   belongs under Dotfiles. In a fresh Cloud task, explicitly read it through the verified link
   at `~/.codex/AGENTS.md` and apply it in this chat. Follow its account guidance when a request
   needs a connected service.
   If the combined command stops early, retain its completed checks and continue independent
   read-only inspection. A check prevented by missing prerequisites is unverified, not another failure.
   The independent environment check is
   `bun --no-env-file <prepared-checkout>/scripts/environment-task.js --check`, through the same unmodified launcher.
   When producing a status report, use `--check-names` in place of that independent `--check`.
   Its successful output lists only verified variable names. Never print the environment file,
   secret values, hashes, tokens or command environment.
   Do not source the loader to turn a failed visibility check into a pass.
4. For **Tanaabot**, run `bun --no-env-file <prepared-checkout>/scripts/publication-task.js local`
   through the actual task launcher. Use the validated local receipt for the setup ID, selector,
   installed commit and sync target. A missing receipt leaves this part unverified. An invalid
   receipt fails this part. Continue the independent inventory even when the receipt check fails.
   Display the receipt details in the status report. During setup review or a fresh published
   startup, also show the verified setup ID in the startup card's Tanaabot note. This step is
   local and read-only. It does not record a publication.
   Enumerate `SKILL.md` files beneath the prepared checkout's `skills/`
   directory. Verify each instruction file is readable and has a nonempty body and valid YAML
   frontmatter with nonempty string `name` and `description` fields. Names must be unique within
   this inventory. Retain every name, description and absolute file path, together with the prepared
   revision, in the chat context for subsequent task selection. Do not write an inventory file.
   A missing or empty skills directory, unreadable file, empty instructions or invalid metadata fails
   this section. If the prepared source or enumeration cannot be established, report it as unverified
   rather than passing a partial inventory. Do not hardcode skill names or counts or execute every
   workflow at startup. For every subsequent request, select applicable skills from both this local
   inventory and the host-supplied catalog. Treat local skills as available even when absent from
   the native catalog; do not wait for the user to name or invoke them. When a skill applies, read
   and follow its full instructions and all applicable required references before the relevant work.
   Success means explicit local loading, not native catalog discovery. Do not require Tanaabot
   catalog entries, register skills, fetch a newer revision or require a plugin installation.
5. For **Canon skills**, look for machine names starting with `tanaab-` in the current task's
   catalog, allowing host qualification such as `tanaab:tanaab-skill-author`. Use plugin ownership
   metadata when available to exclude unrelated matches. A nonempty matching catalog establishes
   basic availability only, not ownership from the prefix alone or completeness of a Canon release.
   An accessible catalog with no matches fails this section; unavailable catalog evidence leaves it
   unverified. Canon is delivered through the ChatGPT account independently of this repository.
   When the current catalog exposes Canon's `tanaab-plugin-info`, follow its installed instructions
   to obtain its structured command result. Use `package.version` for the optional status report and
   `skills` for any requested details about what the artifact ships. Keep the result in chat context
   and use the Startup Check report format. If the skill is missing or its result cannot provide a
   version, use the report contract's fallback and continue the independent startup checks.
   Do not inspect the container's plugin registry, require a fixed version or inventory, install,
   update, or query npm during this check.
6. For **Identity**, first establish that the saved environment values are exported in the actual
   task launcher using step 3. Reuse its successful environment check; if loading failed or remains
   unverified, leave commit identity unverified and continue independent identity checks. Do not
   manually source the loader or set overrides to make verification pass. Once loading is verified, run
   `bun --no-env-file <prepared-checkout>/skills/startup-check/scripts/git-identity.js <prepared-checkout>`
   through the same unmodified task launcher, during both post-install review and fresh-chat startup.
   It uses `git var GIT_AUTHOR_IDENT` and `git var GIT_COMMITTER_IDENT` to compare actual commit
   names and emails with the committed Tanaabot identity, honoring Git's environment overrides.
   It also compares effective signing settings with the committed configuration. Exit 0 passes these
   identity and signing-setting checks; exit 1 fails the affected check; exit 2 leaves it unverified.
   `sourceDrift` classifies source changes as `none`, `identity-only` (only `user.name` and `user.email`
   values differ), or `other`. `sourceChanged: true` alone does not fail Dotfiles. Apply the report
   contract's drift rules after all required checks; correct overrides do not excuse signing,
   trust, credential-helper, HTTPS transport or Stow-link failures. Do not reset files or use the
   changed working file as the expected baseline.
   Check SSH signing settings and public-key trust against the prepared manifest and dotfiles.
   Tanaboot checks the private/public key match and
   HTTPS Git configuration offline. It verifies GitHub CLI's protocol, the selected `gh` credential
   helper and both GitHub SSH-to-HTTPS URL rewrites in the actual task and fresh shells.
   Inspect effective settings with read-only commands; do not create a commit, start an agent or
   attempt SSH access at startup. SSH client configuration and authentication-key registration are
   not requirements for HTTPS Git or local signing.
   Inspect the effective GitHub credential-helper chain, matching HTTP authorization settings and
   platform-provided authentication privately for conflicts. The GitHub-scoped empty helper resets
   inherited helpers before selecting `gh auth git-credential`; `GH_TOKEN` supplies the intended
   credential. This does not override platform-injected authentication. Preserve proxy variables,
   TLS verification, platform headers and credential bindings. Do not print helper output or secret
   values, clear platform authentication, log in or fall back to another account. A conflicting
   identity fails Identity; unavailable evidence leaves the affected selection unverified.
   Verify the existing GitHub CLI credential with `gh api --hostname github.com user --jq .login`
   and require the login to match `github.username` in the manifest before checking signing-key registration.
   Reuse that verified login and Tanaboot's established private/public-key match. List the account's
   public signing keys with
   `gh api --hostname github.com --paginate users/<verified-login>/ssh_signing_keys --jq '.[].key'`.
   Consume every page and compare the key type and base64 key data with the installed approved
   public key, ignoring comments. Require an exact match; a matching title alone is insufficient.
   This checks signing-key registration, not SSH authentication or a successful commit signature.
   Do not repeat the private-key check when Tanaboot has already established the match.
   A wrong identity, rejected credential or absent matching signing key fails Identity; unavailable
   network, rate limits or missing prerequisites leave the affected check unverified. Preserve the
   API command's exit status so an incomplete listing cannot pass. Keep raw service errors private.
   Do not register keys, change credentials or inspect connector credentials.
   Retain the verified GitHub login, actual Git author/committer identities, agent email resolved from its manifest
   binding, HTTPS configuration and local signing identity for the optional status report. API identity,
   repository permissions, live HTTPS access and local signing are distinct results. A public read
   may be anonymous or use platform authentication; it does not prove `GH_TOKEN` write access.
   Run live transport and signing tests only during a separately authorized identity check.
   Keep the configured email as identity metadata. Obtain Google authentication evidence from the
   selected native connection when needed.
7. For **Networking**, verify enrollment and the tailnet name from the current Cloud VPN status.
   Use the Cloud runtime’s live proxy status when native observations are unavailable.
   Check database connectivity independently. Reuse the verified 1Password environment from step 3.
   Require `PGHOST` as a single DNS hostname, `PGPORT` as a TCP port number, and nonempty
   `PGUSER` and `PGPASSWORD`. Use `--check-names` if needed. During initial onboarding, defer the
   probe when the saved VPN configuration is waiting for its first publication.

   Follow the Cloud runtime’s VPN recipe in one approved outer command. Start its loopback
   `socat` relay to `PGHOST:PGPORT` on an unused port. Verify the listener started, arrange
   cleanup on exit, and use that port as `local_port` for native `psql`:

   ```sh
   env -u PGSERVICE PGHOSTADDR=127.0.0.1 PGPORT="$local_port" \
     timeout -k 1s 15s psql -X -w -v ON_ERROR_STOP=1 -Atqc 'SELECT 1'
   ```

   Keep `PGHOST`, database settings and SSL settings inherited. Capture the probe output privately.
   Exit 0 with output `1` establishes **Connected** for the database. Give a short, sanitized reason
   if either check fails or cannot run, such as enrollment pending, proxy refused access, or database
   authentication rejected. Keep raw service output and credentials private.

8. Compose the startup card using the report contract. Show all seven status rows together.
   Below them, list any notes by section, with ❌ errors first, then ⚠️ warnings, then ℹ️ information
   such as verified identity-only Git drift. Omit **NOTES** when empty. Append at most one selected
   status report using the contract’s seven H3 sections, including on partial or failed runs.
   Retain revision and diagnostic
   evidence in the working context without creating a receipt or printing routine success details. A script
   returns an exit code; this skill reports the overall result in its response. Do not turn missing
   evidence into a pass or expose private configuration and credentials.

## Bundled Resources

- [Tanaboot](../../tanaboot.sh): Shared host and agent readiness checks.
- [Git identity check](./scripts/git-identity.js): Actual commit identity, signing settings and source-drift classification.
- [Tanaabot Voice](../voice/SKILL.md): Courteous, concise reporting.
- [Startup report contract](./references/startup-report.md): Section criteria, status rules and cards.

## Validation

Confirm that no provisioning, SSH connection or persistent state change was attempted, that all seven startup
rows appear together in order, and that any notes follow the rows in severity order. Check that the
signing-key lookup used the verified expected account, consumed all pages and reused the established local
key match. Check ordinary and explicitly requested output with debug on and off. Explicit requests
always produce one ℹ️ status report. Use verified identity fields and never passwords, tokens or
private-key contents. Apply the overall failure/uncertainty
rules; deferred instruction delivery does not prevent a pass. Distinguish machine checks, explicit local Tanaabot loading and Canon catalog availability. Confirm the retained local
inventory contains each skill's name, description and absolute path. This does not alter the native
catalog. Verify that Plugin Info supplies the version when available and that missing or unreadable
Plugin Info leaves catalog availability and the other startup checks independent of version reporting.
Verify both connections from a fresh published Cloud chat. Check that deferral during initial
onboarding stays unverified.
Maintenance validation checks structure and packaged references; a fresh Cloud trial must
establish that the saved Start skill runs without a manual bootstrap prompt and that a later relevant
request selects and reads the appropriate local skill without naming it in the request.
