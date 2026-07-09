import type { Answers } from "@flowkit/core"

export interface FlowAdapter {
  /** Persiste le risposte di un flow. */
  submit(flowId: string, answers: Answers): Promise<void>
  /** Carica una bozza di risposte salvata in precedenza, se esiste. */
  loadDraft(flowId: string): Promise<Answers | null>
  /** Salva una bozza intermedia (autosave durante il flow). */
  saveDraft(flowId: string, answers: Answers): Promise<void>
}
