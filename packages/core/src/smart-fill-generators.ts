import { registerSmartFillGenerator } from "./addons"

/**
 * Built-in SmartFill generator: Italian "codice fiscale" (fiscal code), computed from
 * nome/cognome/dataNascita/luogoNascita/sesso.
 *
 * `luogoNascita` must resolve to the 4-character Belfiore cadastral code of the comune
 * (e.g. "H501" for Roma), not a place name: a full ISTAT/Belfiore comuni database is out
 * of scope for this package (~8000 entries, and a hand-maintained subset risks shipping
 * wrong legal codes). A flow wires this by mapping the addon's `luogoNascita` source
 * field to a step whose *value* is already the cadastral code — e.g. a select-cards step
 * with the code as `value`, or a remote-datasource select (see the async-select add-on)
 * backed by a real comuni API that returns the code. See DECISIONS.md.
 */

const CONSONANT = /[BCDFGHJKLMNPQRSTVWXYZ]/
const VOWEL = /[AEIOU]/

function extractNameCode(word: string, isGivenName: boolean): string {
  const letters = word.toUpperCase().replace(/[^A-Z]/g, "")
  const consonants = [...letters].filter((c) => CONSONANT.test(c))
  const vowels = [...letters].filter((c) => VOWEL.test(c))

  const code =
    isGivenName && consonants.length >= 4
      ? consonants[0]! + consonants[2]! + consonants[3]!
      : (consonants.join("") + vowels.join("")).slice(0, 3)

  return code.padEnd(3, "X")
}

/** Month-of-birth letter codes, index 0 = January .. 11 = December. */
const MONTH_CODES = ["A", "B", "C", "D", "E", "H", "L", "M", "P", "R", "S", "T"]

function parseBirthDate(value: string): { year: number; month: number; day: number } | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  if (month < 0 || month > 11 || day < 1 || day > 31) return undefined
  return { year, month, day }
}

/** CIN control-character conversion tables (odd/even 1-indexed position), standard and
 *  public (Agenzia delle Entrate spec) — not derived, just encoded. */
const ODD_POSITION_VALUES: Record<string, number> = {
  "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
  K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
  U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
}
const EVEN_POSITION_VALUES: Record<string, number> = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12,
  N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
}
const REMAINDER_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function computeControlChar(code15: string): string {
  let sum = 0
  for (let i = 0; i < 15; i++) {
    const ch = code15[i]!
    const table = (i + 1) % 2 === 1 ? ODD_POSITION_VALUES : EVEN_POSITION_VALUES
    const value = table[ch]
    if (value === undefined) return ""
    sum += value
  }
  return REMAINDER_LETTERS[sum % 26]!
}

registerSmartFillGenerator({
  id: "codiceFiscale",
  inputs: ["nome", "cognome", "dataNascita", "luogoNascita", "sesso"],
  compute(inputs) {
    const belfiore = inputs.luogoNascita!.trim().toUpperCase()
    if (!/^[A-Z]\d{3}$/.test(belfiore)) return undefined

    const sesso = inputs.sesso!.trim().toUpperCase()
    if (sesso !== "M" && sesso !== "F") return undefined

    const birth = parseBirthDate(inputs.dataNascita!)
    if (!birth) return undefined

    const monthCode = MONTH_CODES[birth.month]
    if (!monthCode) return undefined

    const cognomeCode = extractNameCode(inputs.cognome!, false)
    const nomeCode = extractNameCode(inputs.nome!, true)
    const yearCode = String(birth.year % 100).padStart(2, "0")
    const dayCode = String(birth.day + (sesso === "F" ? 40 : 0)).padStart(2, "0")

    const base15 = `${cognomeCode}${nomeCode}${yearCode}${monthCode}${dayCode}${belfiore}`
    const control = computeControlChar(base15)
    if (!control) return undefined

    return `${base15}${control}`
  },
})
