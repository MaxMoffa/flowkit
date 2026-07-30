import { z } from "zod"

/**
 * Remote data source (v2.30) attachable to the "elenco/select" step types
 * (select-cards, chips, radio, multi-select): replaces (or, in autocomplete mode,
 * supplements) a static `options` array with results fetched from an HTTP endpoint.
 * Schema-only here; the actual fetch/debounce/cache/pagination state lives in
 * @flowkit-io/react's useRemoteOptions hook, which consumes the pure helpers below.
 */
export const remoteDataSourceSchema = z.object({
  endpoint: z.string().min(1),
  method: z.literal("GET").default("GET"),
  /** Extra request headers, e.g. for an API key. */
  headers: z.record(z.string(), z.string()).optional(),
  /** Field (one level of dot nesting allowed, e.g. "name.it") used as the option label. */
  labelField: z.string().default("label"),
  /** Field used as the option value. */
  valueField: z.string().default("value"),
  /** Dot path to the items array within the JSON response body. Unset = the body itself is the array. */
  itemsPath: z.string().optional(),
  /** Dot path to a boolean in the response indicating more pages exist. Unset = inferred
   *  from whether the page came back with a full `pageSize` batch. */
  hasMorePath: z.string().optional(),
  /** Query params always sent as-is. */
  staticParams: z.record(z.string(), z.string()).optional(),
  /** Query param name -> id of a previous step whose current (string) answer supplies
   *  the value. The request waits until every mapped source step has a non-empty answer. */
  paramsFromSteps: z.record(z.string(), z.string()).optional(),
  /** Presence of this field turns the step into a search-autocomplete: it names the
   *  query param that carries the user's typed search text. Unset = a plain remote list,
   *  fetched once (then paginated via "carica altro"), no search box. */
  searchParam: z.string().optional(),
  /** Autocomplete only: minimum typed characters before fetching. */
  minSearchLength: z.number().int().nonnegative().default(1),
  /** Autocomplete only: debounce delay after the user stops typing. */
  debounceMs: z.number().int().nonnegative().default(300),
  /** Query param name for the (1-based) page number, sent from the second page on. */
  pageParam: z.string().default("page"),
  /** Query param name carrying the page size, sent only when `pageSize` is set. */
  pageSizeParam: z.string().default("pageSize"),
  /** Items requested per page. Unset = no pagination ("carica altro" never shows). */
  pageSize: z.number().int().positive().optional(),
})

export type RemoteDataSource = z.infer<typeof remoteDataSourceSchema>

export interface RemoteOption {
  value: string
  label: string
}

function getPath(source: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined),
      source,
    )
}

/**
 * Pure mapping from a parsed JSON response body to RemoteOption[]. Never throws:
 * a response that doesn't match the configured shape yields no options rather than
 * crashing the step.
 */
export function extractRemoteOptions(body: unknown, config: RemoteDataSource): RemoteOption[] {
  const rawItems = config.itemsPath ? getPath(body, config.itemsPath) : body
  if (!Array.isArray(rawItems)) return []

  const options: RemoteOption[] = []
  for (const item of rawItems) {
    const rawValue = getPath(item, config.valueField)
    const rawLabel = getPath(item, config.labelField)
    if (rawValue === undefined || rawValue === null || rawLabel === undefined || rawLabel === null) continue
    options.push({ value: String(rawValue), label: String(rawLabel) })
  }
  return options
}

/** Pure heuristic for whether a "carica altro" button should show after this page. */
export function extractHasMore(body: unknown, config: RemoteDataSource, receivedCount: number): boolean {
  if (config.hasMorePath) {
    const value = getPath(body, config.hasMorePath)
    if (typeof value === "boolean") return value
  }
  return config.pageSize !== undefined && receivedCount >= config.pageSize
}

/**
 * Resolves the query params for one request. Returns undefined when the request isn't
 * fetchable yet: a `paramsFromSteps` source step hasn't been answered, or (autocomplete
 * mode) no search term was supplied.
 */
export function resolveRemoteDataSourceParams(
  config: RemoteDataSource,
  answers: Record<string, unknown>,
  extra: { page?: number; search?: string } = {},
): URLSearchParams | undefined {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(config.staticParams ?? {})) {
    params.set(key, value)
  }

  for (const [paramName, stepId] of Object.entries(config.paramsFromSteps ?? {})) {
    const raw = answers[stepId]
    if (typeof raw !== "string" || raw.trim().length === 0) return undefined
    params.set(paramName, raw)
  }

  if (config.searchParam) {
    if (extra.search === undefined) return undefined
    params.set(config.searchParam, extra.search)
  }

  if (extra.page && extra.page > 1) params.set(config.pageParam, String(extra.page))
  if (config.pageSize !== undefined) params.set(config.pageSizeParam, String(config.pageSize))

  return params
}

export function buildRemoteDataSourceUrl(config: RemoteDataSource, params: URLSearchParams): string {
  const query = params.toString()
  if (!query) return config.endpoint
  const separator = config.endpoint.includes("?") ? "&" : "?"
  return `${config.endpoint}${separator}${query}`
}
