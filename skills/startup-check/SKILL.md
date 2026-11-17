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

- **Always:** Read and apply [Tanaboot usage](../../TANABOOT.md#usage) for check behavior and limits.
- **Before reporting:** Read and apply [Tanaabot Voice](../voice/SKILL.md).
- **Before assigning results or composing the card:** Read and apply the
  [startup report contract](./references/startup-report.md).

## When to Use

- Starting a fresh task in a prepared Tanaabot Cloud environment through its Start skill.
- An explicit request to verify an existing Tanaabot Cloud installation.

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
   belongs under Dotfiles. Automatic instruction delivery is outside this pilot's result and remains
   [#16](https://github.com/tanaabased/tanaabot/issues/16); do not add a separate guidance row or warning.
   If the combined command stops early, retain its completed checks and continue independent
   read-only inspection. A check prevented by missing prerequisites is unverified, not another failure.
   The independent environment check is
   `bun --no-env-file <prepared-checkout>/scripts/environment-task.js --check`, through the same unmodified launcher.
   Never print the environment file, secret values, hashes, tokens or command environment. Only the
   verified public identity fields named in the report contract may appear in the identity card.
   Do not source the loader to turn a failed visibility check into a pass.
4. For **Tanaabot skills**, enumerate `SKILL.md` files beneath the prepared checkout's `skills/`
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
   Do not inspect the container's plugin registry, require a fixed version or inventory, install,
   update, or query npm during this check.
6. For **Identity**, run
   `bun --no-env-file <prepared-checkout>/skills/startup-check/scripts/git-identity.js <prepared-checkout>`
   through the same unmodified task launcher, during both post-install review and fresh-chat startup.
   It compares the committed Git identity with the working configuration and the author/committer Git
   would use in the prepared checkout. Retain its timestamp, revision and identity origins in context.
   Exit 1 fails Identity; a changed source file also fails Dotfiles, even when its Stow link matches.
   Exit 2 leaves this check unverified. Do not reset files or override identity before checking.
   For a requested lifecycle diagnosis, show these observations in the builder and fresh chat;
   compare the same revision to locate when drift appeared. This does not identify the writer.
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
   Retain the verified GitHub login, effective Git name/email, agent email resolved from its manifest
   binding, HTTPS configuration and local signing identity for the identity card. API identity,
   repository permissions, live HTTPS access and local signing are distinct results. A public read
   may be anonymous or use platform authentication; it does not prove `GH_TOKEN` write access.
   Live transport and signing tests belong to the authorized Cloud pilot, not read-only startup.
   Email configuration is identity, not proof of Google authentication; connected-account selection
   remains [#11](https://github.com/tanaabased/tanaabot/issues/11).
7. Compose the startup card using the report contract. Keep successful and not-applicable rows terse;
   show explanatory details only for failed or unverified rows. Append the success-only identity
   card only when Environment and Identity both pass. Otherwise omit it and keep the affected
   check's explanation in the startup card, without another warning card. Retain revision and diagnostic
   evidence in the working context without creating a receipt or printing routine success details. A script
   returns an exit code; this skill reports the overall result in its response. Do not turn missing
   evidence into a pass or expose private configuration and credentials.

## Bundled Resources

- [Tanaboot](../../tanaboot.sh): Shared host and agent readiness checks.
- [Git identity diagnostic](./scripts/git-identity.js): Read-only committed-source and effective identity comparison.
- [Tanaabot Voice](../voice/SKILL.md): Courteous, concise reporting.
- [Startup report contract](./references/startup-report.md): Section criteria, status rules and cards.

## Validation

Confirm that no provisioning, SSH connection or state change was attempted, that all six startup
rows appear in order, and that only failed or unverified startup rows carry details. Check that the
signing-key lookup used the verified expected account, consumed all pages and reused the established local
key match. Show the identity card only when Environment and Identity pass; use actual verified
identity fields and never passwords, tokens or private-key contents. Apply the overall failure/uncertainty
rules; deferred instruction delivery does not prevent a pass. Distinguish machine checks, explicit local Tanaabot loading and Canon catalog availability. Confirm the retained local
inventory contains each skill's name, description and absolute path. This does not alter the native
catalog. Maintenance validation checks structure and packaged references; a fresh Cloud trial must
establish that the saved Start skill runs without a manual bootstrap prompt and that a later relevant
request selects and reads the appropriate local skill without naming it in the request.
