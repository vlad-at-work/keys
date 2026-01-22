# Keys project agent rules (Codex)

## Workflow rules

- Do not create new `.md` files unless explicitly asked.
- Do not create git commits unless explicitly asked.
- When you make code changes, end your response with a proposed commit message.

## Vibecode versioning

- `src/version.ts` is the source of truth for the UI version string.
- Starting with `0.11.1`, we use SemVer: `MAJOR.MINOR.PATCH`.
- Any time you change something under `src/`, explicitly consider whether this warrants a version bump (and which level) using the rules below; if you decide not to bump, say why.
- Bump rules:
  - `PATCH`: UI polish, bug fixes, copy tweaks, tiny refactors.
  - `MINOR`: new user-facing features/settings, new screens, new mechanics.
  - `MAJOR`: breaking changes (resetting stored state, changing JSON schema, removing functionality).

### How to choose the bump automatically

Pick the highest matching category:

- `MAJOR` if a user would need to re-learn/reconfigure something:
  - Stored data resets/migrations required.
  - Breaking API/schema changes (e.g. layout JSON format changes).
  - Removing a key feature or changing core behavior incompatibly.
- `MINOR` if a user gets new capability but old flows keep working:
  - New settings page items, new mechanics, new screens/sections.
  - New persisted state keys (additive), new layout types.
- `PATCH` if nothing “new” is added (polish/bugfix):
  - Fixing incorrect behavior, tuning UI/UX, performance tweaks.

If unsure: default to `PATCH`.
