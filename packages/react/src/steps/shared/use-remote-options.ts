import { useEffect, useRef, useState } from "react"
import {
  buildRemoteDataSourceUrl,
  extractHasMore,
  extractRemoteOptions,
  resolveRemoteDataSourceParams,
} from "@flowkit-io/core"
import type { Answers, RemoteDataSource, RemoteOption } from "@flowkit-io/core"

export type RemoteOptionsStatus = "idle" | "loading" | "loaded" | "empty" | "error"

export interface UseRemoteOptionsResult {
  /** False when the step has no dataSource: the view should just use its static options. */
  isRemote: boolean
  /** True when dataSource.searchParam is set: the view should show a search input
   *  instead of fetching eagerly. */
  isAutocomplete: boolean
  options: RemoteOption[]
  status: RemoteOptionsStatus
  errorMessage: string | null
  retry: () => void
  canLoadMore: boolean
  loadingMore: boolean
  loadMore: () => void
  search: string
  setSearch: (value: string) => void
}

/** Caches parsed response bodies by request URL, shared across step instances in the
 *  same page load: revisiting the same query (e.g. retyping a search term, or an
 *  autocomplete option list re-mounting after navigation) doesn't refetch. */
const responseBodyCache = new Map<string, unknown>()

const NOT_REMOTE: UseRemoteOptionsResult = {
  isRemote: false,
  isAutocomplete: false,
  options: [],
  status: "idle",
  errorMessage: null,
  retry: () => {},
  canLoadMore: false,
  loadingMore: false,
  loadMore: () => {},
  search: "",
  setSearch: () => {},
}

/**
 * Fetches/paginates/debounces a step's remote `dataSource`, if any. Steps with no
 * dataSource get a stable no-op result so views can call this hook unconditionally
 * and fall back to their static `options` when `!isRemote`.
 */
export function useRemoteOptions(dataSource: RemoteDataSource | undefined, answers: Answers): UseRemoteOptionsResult {
  const isAutocomplete = !!dataSource?.searchParam
  const [search, setSearch] = useState("")
  const [options, setOptions] = useState<RemoteOption[]>([])
  const [status, setStatus] = useState<RemoteOptionsStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const requestIdRef = useRef(0)

  // Params that don't depend on page/search: used to detect "the source answers this
  // dataSource depends on changed" and re-fetch from page 1.
  const baseParams = dataSource ? resolveRemoteDataSourceParams(dataSource, answers) : undefined
  const baseParamsKey = baseParams ? baseParams.toString() : null

  async function runFetch(pageToLoad: number, searchTerm: string | undefined, append: boolean) {
    if (!dataSource) return
    const params = resolveRemoteDataSourceParams(dataSource, answers, { page: pageToLoad, search: searchTerm })
    if (!params) {
      setOptions([])
      setStatus("idle")
      return
    }

    const url = buildRemoteDataSourceUrl(dataSource, params)
    const myRequestId = ++requestIdRef.current

    if (responseBodyCache.has(url)) {
      const body = responseBodyCache.get(url)
      const items = extractRemoteOptions(body, dataSource)
      setOptions((prev) => (append ? [...prev, ...items] : items))
      setHasMore(extractHasMore(body, dataSource, items.length))
      setStatus(!append && items.length === 0 ? "empty" : "loaded")
      return
    }

    if (append) setLoadingMore(true)
    else setStatus("loading")
    setErrorMessage(null)

    try {
      const response = await fetch(url, { method: "GET", headers: dataSource.headers })
      if (myRequestId !== requestIdRef.current) return // superseded by a newer request
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const body: unknown = await response.json()
      responseBodyCache.set(url, body)
      const items = extractRemoteOptions(body, dataSource)
      setOptions((prev) => (append ? [...prev, ...items] : items))
      setHasMore(extractHasMore(body, dataSource, items.length))
      setStatus(!append && items.length === 0 ? "empty" : "loaded")
    } catch (err) {
      if (myRequestId !== requestIdRef.current) return
      setErrorMessage(err instanceof Error ? err.message : "Errore di rete.")
      setStatus("error")
    } finally {
      if (myRequestId === requestIdRef.current) setLoadingMore(false)
    }
  }

  // Non-autocomplete: fetch once, and again whenever the resolved source-step params change.
  useEffect(() => {
    if (!dataSource || isAutocomplete) return
    setPage(1)
    void runFetch(1, undefined, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch only on config/param changes, not on every render
  }, [dataSource, isAutocomplete, baseParamsKey])

  // Autocomplete: debounce the typed search term, reset to page 1 on every new search.
  useEffect(() => {
    if (!dataSource || !isAutocomplete) return
    if (search.trim().length < dataSource.minSearchLength) {
      setOptions([])
      setStatus("idle")
      return
    }
    const timer = setTimeout(() => {
      setPage(1)
      void runFetch(1, search.trim(), false)
    }, dataSource.debounceMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch only on config/search/param changes, not on every render
  }, [dataSource, isAutocomplete, search, baseParamsKey])

  if (!dataSource) return NOT_REMOTE

  return {
    isRemote: true,
    isAutocomplete,
    options,
    status,
    errorMessage,
    retry: () => void runFetch(page, isAutocomplete ? search.trim() : undefined, false),
    canLoadMore: hasMore,
    loadingMore,
    loadMore: () => {
      const nextPage = page + 1
      setPage(nextPage)
      void runFetch(nextPage, isAutocomplete ? search.trim() : undefined, true)
    },
    search,
    setSearch,
  }
}
