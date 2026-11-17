# Startup report

Return the quoted startup card with these six rows, in this order. Use normal sentence
capitalization. Successful and not-applicable rows contain only the section name and status.
Keep the evidence in working context; include details only for failed or unverified checks, unless
the operator explicitly requests diagnostic evidence. Append the success-only identity card below
only when its conditions are met.

## Sections

| Section         | Required evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Environment     | Prepared Tanaabot checkout, canonical origin and source revision identified; supported Linux and actual task command launcher established. The saved environment selects the manifest's 1Password Environment, contains valid variables and all its values match the actual exported environment. Derive the variables from the file; never print secret values.                                                                                                                                                                                 |
| Dependencies    | Brewfile executables discoverable on the task's effective PATH, usable version output, and declared Node/Bun major versions satisfied. Homebrew maintenance permissions are not required.                                                                                                                                                                                                                                                                                                                                                        |
| Dotfiles        | The `ai`, `shell`, `git`, `gh` and `ssh` dotpackages link to the prepared sources and match them. The source Git configuration matches its committed revision. Shell initialization supplies tools and saved variables in fresh shells. The private environment file is outside the checkout, owned by this user with mode 600 in a real mode-700 directory; private storage and key paths are not symlinks.                                                                                                                                     |
| Tanaabot skills | All local `SKILL.md` files beneath the prepared checkout's `skills/` are readable, have nonempty instructions and valid frontmatter with unique names and nonempty descriptions. Their names, descriptions and absolute paths are retained in chat context. This is explicit local loading; native catalog registration is not required or implied.                                                                                                                                                                                              |
| Canon skills    | The task catalog contains machine names starting with `tanaab-`, allowing host qualification. Use ownership metadata when available to exclude unrelated matches. This establishes basic availability, not a complete release inventory or ownership from names alone. Installation and updates belong to the ChatGPT account.                                                                                                                                                                                                                   |
| Identity        | Effective Git name/email and author/committer identities match the committed Git configuration. Agent email binding, SSH signing configuration, public key and allowed signers match the prepared configuration; the private key matches the approved public key. GitHub CLI and Git select HTTPS with the intended credential helper and URL rewrites; inspect platform authentication separately. The GitHub CLI credential returns the manifest's username, and that account's complete public signing-key listing contains the matching key. |

Use this same skill and card for post-install review and fresh-task startup. A saved environment
file proves a snapshot was fetched; an offline check cannot prove it still matches current 1Password
contents. Refresh belongs to installation or explicit maintenance, never startup verification.
Automatic global-instruction delivery remains separate post-pilot work and does not create a warning.

A passed Tanaabot skills row establishes local loading in this chat. It does not prove that the
environment automatically ran its saved Start skill or that a later request selected the right
local skill; verify those behaviors in the fresh pilot.

## Status rules

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

For a failed or incomplete card, describe the specific missing condition in its row and give one
concise **Next step** for the affected checks. Add **Technical detail** only when a safe error code,
path or command materially helps recovery. Never include tokens, secret values or credential dumps.
Do not append raw logs, duplicate status summaries, separate warning cards, or routine successful
revisions and tool paths. The identity card below is the only additional success card. Do not repair
anything during verification.

## Identity card

Append this card after the startup card only when **Environment** and **Identity** both passed.
Otherwise omit it; failures and uncertainty belong in the corresponding startup rows and their
shared Next step. This avoids claiming loaded environment values or a verified identity when their
checks could not establish them.

Use the verified GitHub login, effective Git name/email, resolved agent email and configured SSH
private-key path. Show HTTPS as configured and the signing-key registration result separately.
Report 1Password as loaded and available only from the passed Environment check; do not refresh it
or print passwords, tokens, Environment contents or private-key material. Signing-key registration and a matching local private key do not prove a successful commit signature.
HTTPS configuration and API identity do not prove live Git access or repository write permission.
Keep those pilot results separate; outbound SSH is not required.

The example below assumes all checks passed and the displayed identity values were observed:

> ## 🤖 Identity
>
> - **GitHub:** `tanaabot` — authenticated
> - **Git name:** `tanaabot`
> - **Git email:** `tanaabot@tanaab.dev`
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
> - **Canon skills — unverified:** This task's catalog does not expose the evidence needed to check Canon availability.
> - **Identity — passed**
>
> **Next step:** Inspect Canon availability in a fresh task with access to its supplied skill catalog.

### Failed

> ## ❌ Startup check failed
>
> - **Environment — passed**
> - **Dependencies — passed**
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — passed**
> - **Identity — failed:** The approved public signing key is absent from the verified GitHub account.
>
> **Next step:** Check the approved key's GitHub signing-key registration, then rerun verification.
