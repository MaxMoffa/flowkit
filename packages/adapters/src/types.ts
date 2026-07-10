import type { Answers } from "@flowkit/core"

export interface FlowAdapter {
  /** Persiste le risposte di un flow. */
  submit(flowId: string, answers: Answers): Promise<void>
  /** Carica una bozza di risposte salvata in precedenza, se esiste. */
  loadDraft(flowId: string): Promise<Answers | null>
  /** Salva una bozza intermedia (autosave durante il flow). */
  saveDraft(flowId: string, answers: Answers): Promise<void>
  /**
   * Opzionale: persiste le risposte con un id univoco e restituisce un link
   * condivisibile. Additivo rispetto a submit/loadDraft/saveDraft — solo gli
   * adapter che vogliono supportare la resultAction "resultLink" lo
   * implementano; il wiring a confirmation.resultActions.resultLink.createLink
   * è responsabilità del consumer, non di @flowkit/react.
   */
  createResultLink?(flowId: string, answers: Answers): Promise<{ id: string; url: string }>
}
