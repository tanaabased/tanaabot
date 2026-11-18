# Startup report

Start the quoted card with its overall result, followed by all six rows in the order below.
Each row contains only the bold section name and status. Use normal sentence capitalization.
After the last row, include **Notes** only when there is something to explain. Keep the heading
and its bullet list inside the quote. Order notes by severity: ❌ errors, ⚠️ warnings, then ℹ️
information. Within a severity, follow the order of the checks. Start each bullet with its
emoji and bold section name. Append the identity card only when its conditions are met.

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
pass when every section passes. The identity-card conditions remain unchanged.

- **passed:** All required evidence for the section is established.
- **failed:** A required condition is demonstrably unmet. Preserve other completed checks.
- **unverified:** Evidence is unavailable, incomplete, or the check could not run. Do not infer
  failure from an inaccessible catalog, or success from a partial inventory.
- **not applicable:** The section has no requirements in the current scope. Do not use this to
  excuse a missing required check.

Any failed required check makes the overall result **❌ Startup check failed**. Otherwise, any
unverified required check makes it **⚠️ Startup check incomplete**. Otherwise use
**✅ Startup check passed**. A section with both failure and uncertainty is failed; mention the
unverified remainder briefly when it affects recovery. A script exit code is evidence for the
operation it ran, not an exit code returned by the skill or proof of unrelated sections.

For each failed check, give the observed failure in an error note. For an unverified check,
give the missing evidence in a warning note. Include a concise next step in the relevant bullet.
Keep routine evidence in working context. Include a safe error code, path or command only when
it helps recovery or the operator requests diagnostics. Never include tokens, secret values or credential dumps.
Do not append raw logs, duplicate status summaries, separate warning cards, or routine successful
revisions and tool paths. The identity card below is the only additional success card. Do not repair
anything during verification.

## Identity card

Append this card after the startup card only when **Environment** and **Identity** both passed.
Otherwise omit it and explain the affected checks in the startup card’s **Notes**.

Use the verified GitHub login, actual Git author/committer names and emails, resolved agent email and configured SSH
private-key path. Show HTTPS as configured and the signing-key registration result separately.
Report 1Password as loaded and available only from the passed Environment check; do not refresh it
or print passwords, tokens, Environment contents or private-key material. Signing-key registration and a matching local private key do not prove a successful commit signature.
HTTPS configuration and API identity do not prove live Git access or repository write permission.
Keep those pilot results separate; outbound SSH is not required.

The example below assumes all checks passed and the displayed identity values were observed:

> ## 🤖 Identity
>
> - **GitHub:** `tanaabot` — authenticated
> - **Git author:** `tanaabot <tanaabot@tanaab.dev>`
> - **Git committer:** `tanaabot <tanaabot@tanaab.dev>`
> - **Agent email:** `tanaabot@tanaab.dev`
> - **Signing key:** `~/.ssh/id_tanaabot`
> - **Signing ownership:** Registered to `tanaabot`; private/public keys match
> - **Git transport:** HTTPS configured
> - **Git signing:** Local SSH signing configured
> - **1Password environment:** Loaded and available

## Examples

These illustrate the startup card's formatting; they are not observed results. Append the identity
card when its conditions are met. Replace failure details and next steps with actual evidence.
Preserve the quoted H2 heading and blank quoted line before the rows.

### Passed

> ## ✅ Startup check passed
>
> - **Environment — passed**
> - **Dependencies — passed**
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — passed**
> - **Identity — passed**

### Incomplete

> ## ⚠️ Startup check incomplete
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

> ## ❌ Startup check failed
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
