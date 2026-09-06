/**
 * Version of the *flow config's own shape* — not the `@flowkit-io/core` npm package's
 * semver, a separate, much slower-moving number. Bumped only when a change to
 * `Flow`/a step's config would otherwise break parsing an already-saved flow (a field
 * renamed/removed, a validation rule tightened so an old config no longer satisfies
 * it). A new optional field, a new step type, or any other additive/backward-
 * compatible change never needs a bump — only "a flow that used to `parseFlow()`
 * successfully no longer does" does.
 *
 * A flow saved before this field existed carries no `schemaVersion` at all — treated
 * as `1` (see `migrateFlowInput`), the baseline this mechanism starts counting from.
 * That's not a claim that nothing ever changed before now: every flow shape shipped
 * so far is still schema version 1. The first breaking change bumps this to `2` and
 * adds a `1: (raw) => ...` entry to `FLOW_MIGRATIONS` below.
 */
export const CURRENT_FLOW_SCHEMA_VERSION = 1

/**
 * Transforms a raw flow object from the shape version `fromVersion` produced into the
 * shape version `fromVersion + 1` expects. Runs on plain, unvalidated data — before
 * zod ever sees it, not on a parsed `Flow`. Keyed by the version it migrates FROM in
 * `FLOW_MIGRATIONS`.
 */
export type FlowMigration = (raw: Record<string, unknown>) => Record<string, unknown>

/**
 * Registered migrations, keyed by the version each one migrates FROM. Empty for
 * now — `CURRENT_FLOW_SCHEMA_VERSION` is still `1`, nothing to migrate from yet.
 */
export const FLOW_MIGRATIONS: Record<number, FlowMigration> = {}

/** Reads `schemaVersion` off a raw (unvalidated) flow-shaped value, defaulting to `1`
 *  for anything not a plain object or without a valid positive-integer `schemaVersion`
 *  of its own — letting zod's own validation surface what's actually wrong with a
 *  malformed input, rather than this function guessing. */
export function getRawFlowSchemaVersion(input: unknown): number {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return 1
  const raw = (input as Record<string, unknown>).schemaVersion
  return typeof raw === "number" && Number.isInteger(raw) && raw > 0 ? raw : 1
}

/**
 * Runs every migration needed to bring `input` up to `CURRENT_FLOW_SCHEMA_VERSION`,
 * stamping the result with it. Called by `parseFlow` (schema.ts) before zod
 * validation, so a flow saved under an older schema version keeps parsing across a
 * breaking change instead of failing outright — the same job a database migration
 * does for old rows.
 *
 * - `input` not a plain object: passed straight through, unmigrated — zod's own
 *   validation in `parseFlow` will reject it with its normal, specific error.
 * - `schemaVersion` newer than `CURRENT_FLOW_SCHEMA_VERSION`: throws immediately.
 *   This build of `@flowkit-io/core` is older than whatever produced the flow;
 *   validating it against an older schema risks silently accepting a flow that's
 *   missing a since-required field instead of a clear "upgrade the library" error.
 * - A version has no registered migration (shouldn't happen once `FLOW_MIGRATIONS`
 *   actually covers every version below current, but guards against a gap): stops
 *   migrating there. The returned `schemaVersion` reflects the version actually
 *   reached, NOT `targetVersion` — stamping the target despite stopping early would
 *   claim the object is fully migrated when it isn't, the exact "silently under-
 *   migrating" this guard exists to avoid. `parseFlow`'s zod validation then surfaces
 *   whatever's still wrong with the (still old-shaped) result on its own terms.
 *
 * The returned value's `schemaVersion` is exactly `targetVersion` (defaults to
 * `CURRENT_FLOW_SCHEMA_VERSION`) whenever every migration needed to get there was
 * registered — the normal case once `FLOW_MIGRATIONS` has no gaps below current, and
 * the only case a parsed `Flow` should ever actually reach (a gap fails validation
 * before anything downstream sees a partially-migrated object).
 *
 * `targetVersion` exists so `flow-versioning.test.ts` can exercise a multi-step
 * migration chain without waiting for `CURRENT_FLOW_SCHEMA_VERSION` to actually reach
 * that number — real callers (`parseFlow`) never pass it, always migrating to current.
 */
export function migrateFlowInput(input: unknown, targetVersion = CURRENT_FLOW_SCHEMA_VERSION): unknown {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return input
  let migrated = input as Record<string, unknown>
  let version = getRawFlowSchemaVersion(migrated)

  if (version > targetVersion) {
    const id = typeof migrated.id === "string" ? migrated.id : "?"
    throw new Error(
      `Flow "${id}" was saved with schema version ${version}, newer than this ` +
        `@flowkit-io/core build supports (max ${targetVersion}). ` +
        `Upgrade @flowkit-io/core before loading it.`,
    )
  }

  while (version < targetVersion) {
    const migrate = FLOW_MIGRATIONS[version]
    if (!migrate) break
    migrated = migrate(migrated)
    version += 1
  }

  return { ...migrated, schemaVersion: version }
}
