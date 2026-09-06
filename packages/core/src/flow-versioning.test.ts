import { afterEach, describe, expect, it } from "vitest"
import {
  CURRENT_FLOW_SCHEMA_VERSION,
  FLOW_MIGRATIONS,
  getRawFlowSchemaVersion,
  migrateFlowInput,
} from "./flow-versioning"
import { parseFlow } from "./schema"
import "./intro-step"
import "./confirmation-step"

describe("getRawFlowSchemaVersion", () => {
  it("defaults to 1 when the field is absent", () => {
    expect(getRawFlowSchemaVersion({ id: "f" })).toBe(1)
  })

  it("defaults to 1 for non-object input", () => {
    expect(getRawFlowSchemaVersion(null)).toBe(1)
    expect(getRawFlowSchemaVersion(undefined)).toBe(1)
    expect(getRawFlowSchemaVersion("flow")).toBe(1)
    expect(getRawFlowSchemaVersion([1, 2])).toBe(1)
  })

  it("defaults to 1 for an invalid schemaVersion (not a positive integer)", () => {
    expect(getRawFlowSchemaVersion({ schemaVersion: 0 })).toBe(1)
    expect(getRawFlowSchemaVersion({ schemaVersion: -1 })).toBe(1)
    expect(getRawFlowSchemaVersion({ schemaVersion: 1.5 })).toBe(1)
    expect(getRawFlowSchemaVersion({ schemaVersion: "2" })).toBe(1)
  })

  it("reads a valid schemaVersion", () => {
    expect(getRawFlowSchemaVersion({ schemaVersion: 3 })).toBe(3)
  })
})

describe("migrateFlowInput", () => {
  it("passes non-object input straight through, unmigrated", () => {
    expect(migrateFlowInput(null)).toBeNull()
    expect(migrateFlowInput("nope")).toBe("nope")
    expect(migrateFlowInput([1, 2])).toEqual([1, 2])
  })

  it("stamps schemaVersion: 1 on a plain object with none, preserving other fields", () => {
    const result = migrateFlowInput({ id: "f", title: "F" })
    expect(result).toEqual({ id: "f", title: "F", schemaVersion: 1 })
  })

  it("is a no-op (besides the stamp) when already at CURRENT_FLOW_SCHEMA_VERSION", () => {
    const result = migrateFlowInput({ id: "f", schemaVersion: CURRENT_FLOW_SCHEMA_VERSION })
    expect(result).toEqual({ id: "f", schemaVersion: CURRENT_FLOW_SCHEMA_VERSION })
  })

  it("throws when schemaVersion is newer than the target version", () => {
    expect(() => migrateFlowInput({ id: "future-flow", schemaVersion: 5 }, 1)).toThrow(
      /future-flow.*schema version 5.*newer.*max 1/s,
    )
  })

  it("throws with a \"?\" placeholder when the flow has no id", () => {
    expect(() => migrateFlowInput({ schemaVersion: 5 }, 1)).toThrow(/"\?"/)
  })

  describe("multi-step migration chain (synthetic — FLOW_MIGRATIONS is empty at v1 baseline)", () => {
    afterEach(() => {
      delete FLOW_MIGRATIONS[1]
      delete FLOW_MIGRATIONS[2]
    })

    it("runs every registered migration in order up to targetVersion", () => {
      FLOW_MIGRATIONS[1] = (raw) => ({ ...raw, touchedByV1: true })
      FLOW_MIGRATIONS[2] = (raw) => ({ ...raw, touchedByV2: true })

      const result = migrateFlowInput({ id: "f" }, 3)

      expect(result).toEqual({ id: "f", touchedByV1: true, touchedByV2: true, schemaVersion: 3 })
    })

    it("starts from the input's own version, not always from 1", () => {
      FLOW_MIGRATIONS[1] = (raw) => ({ ...raw, touchedByV1: true })
      FLOW_MIGRATIONS[2] = (raw) => ({ ...raw, touchedByV2: true })

      const result = migrateFlowInput({ id: "f", schemaVersion: 2 }, 3)

      expect(result).toEqual({ id: "f", schemaVersion: 3, touchedByV2: true })
    })

    it("stops at a gap and honestly reports the version actually reached, not the target", () => {
      FLOW_MIGRATIONS[1] = (raw) => ({ ...raw, touchedByV1: true })
      // No migration registered for version 2 — a gap before targetVersion 3.

      const result = migrateFlowInput({ id: "f" }, 3)

      expect(result).toEqual({ id: "f", touchedByV1: true, schemaVersion: 2 })
    })
  })
})

describe("parseFlow: schemaVersion end to end", () => {
  const baseSteps = [
    { id: "start", type: "intro", title: "Start" },
    { id: "end", type: "confirmation" },
  ]

  it("a flow with no schemaVersion parses fine and comes out stamped at CURRENT_FLOW_SCHEMA_VERSION", () => {
    const flow = parseFlow({ id: "f", title: "F", steps: baseSteps })
    expect(flow.schemaVersion).toBe(CURRENT_FLOW_SCHEMA_VERSION)
  })

  it("rejects a flow saved with a schemaVersion newer than this build supports", () => {
    expect(() =>
      parseFlow({ id: "future-flow", title: "F", steps: baseSteps, schemaVersion: CURRENT_FLOW_SCHEMA_VERSION + 1 }),
    ).toThrow(/future-flow/)
  })
})
