# Startup report

Start the quoted card with its overall result, followed by all six rows in the order below.
Each row contains only the bold section name and status. Use normal sentence capitalization.
After the last row, include **Notes** only when there is something to explain. Keep the heading
and its bullet list inside the quote. Order notes by severity: ❌ errors, ⚠️ warnings, then ℹ️
information. Within a severity, follow the order of the checks. Start each bullet with its
emoji and bold section name. Use the optional status report below for detailed results.

## Sections

| Section         | Required evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment     | Prepared Tanaabot checkout, canonical origin and source revision identified; supported Linux and actual task command launcher established. The saved environment selects the manifest's 1Password Environment, contains valid variables and all its values match the actual exported environment. Derive the variables from the file; never print secret values.                                                                                                                                                                                                                                                                                                       |
| Dependencies    | Brewfile executables discoverable on the task's effective PATH, usable version output, and declared Node/Bun major versions satisfied. Homebrew maintenance permissions are not required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Dotfiles        | The `ai`, `shell`, `git`, `gh` and `ssh` dotpackages link to the prepared sources and match them. Git source drift meets the assessment rules below; identity-only drift with verified overrides may pass. Shell initialization supplies tools and saved variables in fresh shells. The private environment file is outside the checkout, owned by this user with mode 600 in a real mode-700 directory; private storage and key paths are not symlinks.                                                                                                                                                                                                               |
| Tanaabot skills | All local `SKILL.md` files beneath the prepared checkout's `skills/` are readable, have nonempty instructions and valid frontmatter with unique names and nonempty descriptions. Their names, descriptions and absolute paths are retained in chat context. This is explicit local loading; native catalog registration is not required or implied.                                                                                                                                                                                                                                                                                                                    |
| Canon skills    | The task catalog contains machine names starting with `tanaab-`, allowing host qualification. Use ownership metadata when available to exclude unrelated matches. This establishes basic availability, not a complete release inventory or ownership from names alone. Installation and updates belong to the ChatGPT account.                                                                                                                                                                                                                                                                                                                                         |
| Identity        | After saved environment loading is verified, actual Git author/committer names and emails match the committed Git configuration, including environment overrides. Source drift is assessed separately under Dotfiles. Agent email binding, SSH signing configuration, public key and allowed signers match the prepared configuration; the private key matches the approved public key. GitHub CLI and Git select HTTPS with the intended credential helper and URL rewrites; inspect platform authentication separately. The GitHub CLI credential returns the manifest's username, and that account's complete public signing-key listing contains the matching key. |

Use this same skill and card for post-install review and fresh-task startup. A saved environment
file proves a snapshot was fetched; an offline check cannot prove it still matches current 1Password
contents. Refresh belongs to installation or explicit maintenance, never startup verification.
Automatic global-instruction delivery remains separate post-pilot work and does not create a warning.

A passed Tanaabot skills row establishes local loading in this chat. It does not prove that the
environment automatically ran its saved Start skill or that a later request selected the right
local skill; verify those behaviors in the fresh pilot.

## Status rules

Assess Git source drift against the committed revision, never the changed working file. When
`sourceDrift` is `identity-only`, Dotfiles may pass if saved environment loading was verified through
the actual unmodified task launcher, both effective commit identities match the committed defaults,
and all other required Dotfiles checks pass. Include this bullet in **Notes**:

> - ℹ️ **Dotfiles** — Git’s configured identity differs from the committed defaults. Environment overrides supply the expected author and committer.

For `other` drift, inspect the differences privately and assess effective signing, trusted-key,
credential-helper, HTTPS transport and Stow-link requirements. A difference alone is neither a
failure nor evidence of safety. Required violations still fail; incomplete evidence stays unverified.
The helper's `signingStatus` covers effective signing settings only; reuse Tanaboot's transport checks
and the remaining skill checks. Never print raw configuration differences or attribute changes to
the platform without evidence. The informational note adds no warning and does not prevent an overall
pass when every section passes.

- **passed:** All required evidence for the section is established.
- **failed:** A required condition is demonstrably unmet. Preserve other completed checks.
- **unverified:** Evidence is unavailable, incomplete, or the check could not run. Do not infer
  failure from an inaccessible catalog, or success from a partial inventory.
- **not applicable:** The section has no requirements in the current scope. Do not use this to
  excuse a missing required check.

Any failed required check makes the overall result **❌ STARTUP CHECK · FAILED**. Otherwise, any
unverified required check makes it **⚠️ STARTUP CHECK · INCOMPLETE**. Otherwise use
**✅ STARTUP CHECK · PASSED**. A section with both failure and uncertainty is failed; mention the
unverified remainder briefly when it affects recovery. A script exit code is evidence for the
operation it ran, not an exit code returned by the skill or proof of unrelated sections.

For each failed check, give the observed failure in an error note. For an unverified check,
give the missing evidence in a warning note. Include a concise next step in the relevant bullet.
Keep routine evidence in working context. Include a safe error code, path or command only when
it helps recovery or the operator requests diagnostics. Never include tokens, secret values or credential dumps.
Keep raw logs out of both cards and routine version and path details in the optional status report.

## Optional status report

Always show the startup card first. Select at most one additional heading in this order:

1. An operator request for the status report or details selects **ℹ️ STATUS REPORT**, regardless
   of the debug setting. A mention in the skill instructions or a template is not an operator request.
2. Otherwise, top-level `debug: true` in the prepared checkout’s `.agent-system/agent.yaml`
   selects **🔬 DEBUG · STATUS REPORT**.
3. Otherwise finish after the startup card.

Both headings use the same body. Quote the H2, six H3s and bulleted fields together. Keep
field labels bold and variable names, paths, versions and identities in backticks.
Use the observations from this run. If a check failed or could not run, retain its section,
state the failure or mark missing fields **Unverified**, and keep independently verified facts.

- **Environment:** Use the native environment name, observed OS, actual task shell and verified
  checkout path. Report saved 1Password loading and the names returned by a successful
  `--check-names` in that launcher. Render each name in its own backticks. On failure, mark
  loading and names accordingly. Never dump the process environment or print variable values.
- **Dependencies:** Use one bullet per Brewfile executable, with its observed version from
  Tanaboot’s host check. If the check stopped early, use the remaining executables’ read-only
  `--version` output on the same PATH. Derive the list from the prepared Brewfile.
- **Dotfiles:** List the packages whose expected links and contents were verified. Identify
  incomplete packages separately when applicable.
- **Tanaabot skills:** Run `git -C <prepared-checkout> describe --tags --always --dirty`.
  Report its exact tag, tag plus commit distance and hash, or fallback commit, including the
  dirty suffix when present. Use the verified local inventory count and its actual directory.
- **Canon skills:** Report catalog availability. Use version metadata exposed by the current host
  for the loaded Canon plugin, listing distinct versions if applicable. Label an operator-supplied
  version **reported**; absent evidence, show **Unverified**. Version visibility is independent of
  catalog readiness. Never infer a loaded version from npm, a different install or a skill name.
- **Identity:** Show the verified GitHub login, Git author and committer (combine when equal),
  manifest-bound agent email, configured transport, signing mode, configured key path and key
  verification. Distinguish local key matching and account registration when they differ. Neither
  configured transport nor a registered key proves a live push or signed commit. Keep key material,
  credentials and private service bindings out of the report.

Illustrative requested report (debug uses the same body with the 🔬 heading):

> ## ℹ️ STATUS REPORT
>
> ### Environment
>
> - **Cloud environment** `tanaabot`
> - **Operating system** Linux
> - **Task shell** Bash
> - **Prepared checkout** `/workspace/tanaabot`
> - **1Password environment** Loaded and verified in the task shell
> - **Loaded variables** `EMAIL` `GH_TOKEN`
>
> ### Dependencies
>
> - **Bun** `1.4.4`
> - **curl** `8.12.1`
> - **Git** `2.48.1`
> - **GitHub CLI** `2.67.0`
> - **jq** `1.7.1`
> - **Node.js** `26.12.1`
> - **Stow** `2.4.1`
>
> ### Dotfiles
>
> - **Verified packages** `ai` `gh` `git` `shell` `ssh`
>
> ### Tanaabot skills
>
> - **Source revision** `v0.1.0-3-gabc1234`
> - **Local skills loaded** 7
> - **Skill directory** `/workspace/tanaabot/skills`
>
> ### Canon skills
>
> - **Task catalog** Canon skills available
> - **Plugin version** `0.14.1`
>
> ### Identity
>
> - **GitHub account** `tanaabot` · authenticated
> - **Git author and committer** `tanaabot <tanaabot@tanaab.dev>`
> - **Agent email** `tanaabot@tanaab.dev`
> - **Git transport** HTTPS
> - **Git signing** Local SSH signing configured
> - **Signing key** `~/.ssh/id_tanaabot`
> - **Key verification** Private key matches the public key registered to `tanaabot`

## Examples

These examples illustrate the startup card. Replace their findings with actual evidence.
Preserve the quoted H2 heading and blank quoted line before the rows.

### Passed

> ## ✅ STARTUP CHECK · PASSED
>
> - **Environment — passed**
> - **Dependencies — passed**
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — passed**
> - **Identity — passed**

### Incomplete

> ## ⚠️ STARTUP CHECK · INCOMPLETE
>
> - **Environment — passed**
> - **Dependencies — passed**
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — unverified**
> - **Identity — passed**
>
> **Notes**
>
> - ⚠️ **Canon skills** — This task couldn’t inspect the skill catalog. Check Canon availability in a fresh task with catalog access.

### Failed

> ## ❌ STARTUP CHECK · FAILED
>
> - **Environment — passed**
> - **Dependencies — passed**
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — unverified**
> - **Identity — failed**
>
> **Notes**
>
> - ❌ **Identity** — The approved signing key is missing from the verified GitHub account. Check its signing-key registration before rerunning startup.
> - ⚠️ **Canon skills** — This task couldn’t inspect the skill catalog. Check Canon availability in a fresh task with catalog access.
> - ℹ️ **Dotfiles** — Git’s configured identity differs from the committed defaults. Environment overrides supply the expected author and committer.
