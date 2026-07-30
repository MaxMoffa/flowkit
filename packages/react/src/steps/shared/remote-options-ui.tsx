import type { UseRemoteOptionsResult } from "./use-remote-options"

/** Search box shown only in autocomplete mode (dataSource.searchParam configured). */
export function RemoteSearchInput({
  remote,
  placeholder,
}: {
  remote: UseRemoteOptionsResult
  placeholder?: string
}) {
  if (!remote.isAutocomplete) return null
  return (
    <input
      className="fk-input fk-remote-search"
      type="text"
      placeholder={placeholder ?? "Cerca..."}
      value={remote.search}
      onChange={(e) => remote.setSearch(e.target.value)}
    />
  )
}

/** Loading/empty/error(+retry) states for a remote-backed options list. */
export function RemoteOptionsStatus({ remote }: { remote: UseRemoteOptionsResult }) {
  if (!remote.isRemote) return null

  if (remote.status === "loading") {
    return <p className="fk-remote-status">Caricamento in corso…</p>
  }

  if (remote.status === "error") {
    return (
      <div className="fk-remote-status fk-remote-error">
        <span>Non è stato possibile caricare i risultati.</span>
        <button type="button" className="fk-btn-neutral" onClick={remote.retry}>
          Riprova
        </button>
      </div>
    )
  }

  if (remote.status === "empty") {
    return <p className="fk-remote-status">Nessun risultato trovato.</p>
  }

  return null
}

/** "Carica altro" pagination button, shown only while more pages are available. */
export function RemoteLoadMoreButton({ remote }: { remote: UseRemoteOptionsResult }) {
  if (!remote.isRemote || !remote.canLoadMore) return null
  return (
    <button
      type="button"
      className="fk-btn-neutral fk-remote-load-more"
      onClick={remote.loadMore}
      disabled={remote.loadingMore}
    >
      {remote.loadingMore ? "Caricamento…" : "Carica altro"}
    </button>
  )
}
