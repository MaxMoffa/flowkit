import type { Answers, Flow } from "@flowkit-io/core"
import { answersToText } from "../shared/answers-to-text"
import type { NativeShareConfig } from "./types"

interface NativeShareActionProps {
  config: NativeShareConfig
  fallbackTitle: string
  answers: Answers
  flow: Flow
}

/** Whether the Web Share API exists; the button is hidden everywhere else. Checked per
 *  render rather than once at import, so a polyfill installed later is still picked up. */
export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}

export function NativeShareAction({ config, fallbackTitle, answers, flow }: NativeShareActionProps) {
  function share() {
    // navigator.share() rejects with AbortError every time the user dismisses the
    // native sheet, which is normal behaviour and not something to report.
    navigator
      .share({ title: config.shareTitle ?? fallbackTitle, text: answersToText(answers, "", flow) })
      .catch(() => {})
  }

  return (
    <button type="button" className="fk-btn-neutral fk-native-share-btn" onClick={share}>
      {config.buttonLabel}
    </button>
  )
}
