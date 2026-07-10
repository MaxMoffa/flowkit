import type { Answers } from "@flowkit/core"

export interface FlowAdapter {
  /** Persists a flow's answers. */
  submit(flowId: string, answers: Answers): Promise<void>
  /** Loads a previously saved draft of answers, if one exists. */
  loadDraft(flowId: string): Promise<Answers | null>
  /** Saves an intermediate draft (autosave during the flow). */
  saveDraft(flowId: string, answers: Answers): Promise<void>
  /**
   * Optional: persists the answers with a unique id and returns a shareable
   * link. Additive with respect to submit/loadDraft/saveDraft — only
   * adapters that want to support the "resultLink" resultAction implement
   * it; wiring it to confirmation.resultActions.resultLink.createLink is
   * the consumer's responsibility, not @flowkit/react's.
   */
  createResultLink?(flowId: string, answers: Answers): Promise<{ id: string; url: string }>
}
