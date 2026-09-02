/** Flow interactions that can trigger a short device vibration. */
type HapticEvent = "advance" | "back" | "submit" | "jump" | "restart" | "blocked"

/** Vibration patterns (ms, or on/off/on… lists) per interaction — kept subtle: a forward
 *  tap is a single ~10ms pulse, a blocked attempt a single longer buzz, a submit a short
 *  double. */
const PATTERNS: Record<HapticEvent, number | number[]> = {
  advance: 10,
  back: 8,
  jump: 8,
  restart: 8,
  submit: [14, 10, 14],
  blocked: [28],
}

/**
 * Fire a short device vibration for a flow interaction, when `enabled` and the browser
 * supports the Vibration API. Supported on Android (Chrome/Firefox); iOS Safari has no
 * support, where this is a silent no-op. Never throws.
 */
export function haptic(event: HapticEvent, enabled: boolean): void {
  if (!enabled) return
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  try {
    navigator.vibrate(PATTERNS[event])
  } catch {
    // Some engines throw when called outside a user gesture or when the user disabled
    // vibration at the OS level — treat as a no-op.
  }
}
