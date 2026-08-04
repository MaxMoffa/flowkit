export interface RequestJsonOptions {
  /** Default: "POST". */
  method?: string
  headers?: Record<string, string>
  /** JSON-stringified as the request body when present; omitted (GET-shaped) otherwise. */
  body?: unknown
  fetchImpl?: typeof fetch
}

/**
 * Shared fetch-and-check helper: rest.ts, notion.ts and receipt-email-adapter.ts all
 * hit an HTTP endpoint and throw `${errorLabel}: ${status} ${statusText}` on a non-ok
 * response. Header composition (e.g. merging a caller's own headers with
 * Content-Type) stays the caller's job — it differs enough per adapter that forcing
 * it in here wouldn't save anything real.
 */
export async function requestJson(
  url: string,
  errorLabel: string,
  options: RequestJsonOptions = {},
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch
  const res = await fetchImpl(url, {
    method: options.method ?? "POST",
    headers: options.headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`${errorLabel}: ${res.status} ${res.statusText}`)
  }
  return res
}
