# Startup report

Return one quoted Markdown card with these six rows, in this order. Use normal sentence
capitalization. Successful and not-applicable rows contain only the section name and status.
Keep the evidence in working context; include details only for failed or unverified checks, unless
the operator explicitly requests diagnostic evidence.

## Sections

| Section         | Required evidence                                                                                                                                                                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment     | Prepared Tanaabot checkout, canonical origin and source revision identified; supported Linux and actual task command launcher established. The saved environment selects the manifest's 1Password Environment, contains valid variables and all its values match the actual exported environment. Derive the variables from the file; never print their values. |
| Dependencies    | Brewfile executables discoverable on the task's effective PATH, usable version output, and declared Node/Bun major versions satisfied. Homebrew maintenance permissions are not required.                                                                                                                                                                       |
| Dotfiles        | The `ai`, `shell`, `git`, `gh` and `ssh` dotpackages link to the prepared sources and match them. Shell initialization supplies tools and saved variables in fresh shells. The private environment file is outside the checkout, owned by this user with mode 600 in a real mode-700 directory; private storage and key paths are not symlinks.                 |
| Tanaabot skills | All local `SKILL.md` files beneath the prepared checkout's `skills/` are readable, have nonempty instructions and valid frontmatter with unique names and nonempty descriptions. Their names, descriptions and absolute paths are retained in chat context. This is explicit local loading; native catalog registration is not required or implied.             |
| Canon skills    | The task catalog contains machine names starting with `tanaab-`, allowing host qualification. Use ownership metadata when available to exclude unrelated matches. This establishes basic availability, not a complete release inventory or ownership from names alone. Installation and updates belong to the ChatGPT account.                                  |
| Identity        | Effective Git name/email, SSH signing configuration, public key and allowed signers match the prepared configuration; the private key matches the approved public key. Effective SSH configuration selects that identity. A read-only GitHub API request through the existing CLI credential returns the manifest's GitHub username.                            |

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
Do not append raw logs, a second summary, separate diagnostic cards, or routine successful revisions
and tool paths. Do not repair anything during verification.

## Examples

These illustrate formatting; they are not observed results. Replace failure details and next steps
with actual evidence. Preserve the quoted H2 heading and blank quoted line before the rows.

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
> - **Dependencies — failed:** `gh`, declared in the Brewfile, is missing from the task's PATH.
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — passed**
> - **Identity — passed**
>
> **Next step:** Repair the dependency during environment setup, then rerun verification.
>
> **Technical detail:** The dependency check returned exit code `1`. No repair was attempted.
