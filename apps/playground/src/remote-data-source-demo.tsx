import { parseFlow, type Flow } from "@flowkit-io/core"

/**
 * Demo for the "dataSource" field (v2.30) on elenco/select steps: remote fetch,
 * dependent query params, "carica altro" pagination, and search-autocomplete. Uses the
 * free, stable jsonplaceholder.typicode.com API (json-server backed, supports `_page`/
 * `_limit`/`_like` query params) — no auth, no rate limiting, safe for a public demo.
 */
export const remoteDataSourceDemoFlow: Flow = parseFlow({
  id: "remote-data-source-demo",
  title: "Dati remoti (demo)",
  steps: [
    {
      id: "welcome",
      type: "intro",
      title: "Scegli un utente, poi i suoi post",
      subtitle: "Elenco remoto, con paginazione e ricerca autocomplete.",
      cta: "Inizia",
    },
    {
      id: "user",
      key: "user",
      type: "select-cards",
      title: "Utente",
      subtitle: "Caricato da jsonplaceholder.typicode.com/users.",
      dataSource: {
        endpoint: "https://jsonplaceholder.typicode.com/users",
        labelField: "name",
        valueField: "id",
      },
    },
    {
      id: "post",
      type: "radio",
      title: "Post di questo utente",
      subtitle: "Dipende dall'utente scelto sopra; \"Carica altro\" pagina i risultati.",
      dataSource: {
        endpoint: "https://jsonplaceholder.typicode.com/posts",
        labelField: "title",
        valueField: "id",
        paramsFromSteps: { userId: "user" },
        pageParam: "_page",
        pageSizeParam: "_limit",
        pageSize: 3,
      },
    },
    {
      id: "mention",
      type: "chips",
      title: "Cerca un altro utente da citare",
      subtitle: "Autocomplete: digita almeno 2 caratteri.",
      required: false,
      dataSource: {
        endpoint: "https://jsonplaceholder.typicode.com/users",
        labelField: "name",
        valueField: "id",
        searchParam: "name_like",
        minSearchLength: 2,
        debounceMs: 300,
      },
    },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
