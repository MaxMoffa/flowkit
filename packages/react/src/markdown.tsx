import { Fragment, type ReactElement, type ReactNode } from "react"

/** Restricted markdown renderer for configurable flow text (title/subtitle/description/
 *  label/message/button copy). Allowlist: bold, italic, links, bullet/numbered lists.
 *  Everything else (headings, code, images, raw HTML) is never recognized as syntax, so
 *  it always falls through as literal text — React escapes it on render. No
 *  `dangerouslySetInnerHTML` anywhere: the only injection vector is a link's `href`,
 *  validated below against a protocol allowlist. */

export type FlowMarkdownVariant = "block" | "inline"

export interface FlowMarkdownProps {
  text: string | undefined
  /** "block" allows bullet/numbered lists; "inline" degrades them to plain text. */
  variant: FlowMarkdownVariant
}

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

function isSafeHref(href: string): boolean {
  if (href.startsWith("#") || href.startsWith("/")) return true
  try {
    return SAFE_URL_PROTOCOLS.has(new URL(href, "http://localhost").protocol)
  } catch {
    return false
  }
}

function isExternalHref(href: string): boolean {
  return /^https?:/i.test(href)
}

const INLINE_TOKEN = /(\*\*.+?\*\*|\*.+?\*|_.+?_|\[.+?\]\(.+?\))/

/** Tokenizes one line/list-item into bold/italic/link/text nodes. No nesting: link
 *  labels are always plain text, keeping the scanner flat and ReDoS-safe. */
function renderInlineSegments(line: string, keyPrefix: string): ReactNode[] {
  const parts = line.split(INLINE_TOKEN).filter((part) => part !== "")
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    const boldMatch = /^\*\*(.+)\*\*$/.exec(part)
    if (boldMatch) return <strong key={key}>{boldMatch[1]}</strong>

    const italicMatch = /^\*(.+)\*$/.exec(part) ?? /^_(.+)_$/.exec(part)
    if (italicMatch) return <em key={key}>{italicMatch[1]}</em>

    const linkMatch = /^\[(.+)\]\((.+)\)$/.exec(part)
    if (linkMatch) {
      const label = linkMatch[1] ?? ""
      const href = linkMatch[2] ?? ""
      if (!isSafeHref(href)) return <Fragment key={key}>{label}</Fragment>
      const external = isExternalHref(href)
      return (
        <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {label}
        </a>
      )
    }

    return <Fragment key={key}>{part}</Fragment>
  })
}

const BULLET_RE = /^[-*]\s+(.*)$/
const NUMBERED_RE = /^\d+\.\s+(.*)$/

function stripListMarker(line: string): string {
  return BULLET_RE.exec(line)?.[1] ?? NUMBERED_RE.exec(line)?.[1] ?? line
}

function renderInlineOnly(text: string): ReactNode {
  const lines = text.split("\n").map(stripListMarker)
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      {renderInlineSegments(line, `l${i}`)}
    </Fragment>
  ))
}

function renderBlock(text: string): ReactNode {
  const lines = text.split("\n")
  const nodes: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i] ?? ""
    const bulletMatch = BULLET_RE.exec(line)
    const numberedMatch = NUMBERED_RE.exec(line)

    if (bulletMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const m = BULLET_RE.exec(lines[i] ?? "")
        if (!m) break
        items.push(m[1] ?? "")
        i++
      }
      nodes.push(
        <ul key={key++}>
          {items.map((item, j) => (
            <li key={j}>{renderInlineSegments(item, `li${j}`)}</li>
          ))}
        </ul>
      )
      continue
    }

    if (numberedMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const m = NUMBERED_RE.exec(lines[i] ?? "")
        if (!m) break
        items.push(m[1] ?? "")
        i++
      }
      nodes.push(
        <ol key={key++}>
          {items.map((item, j) => (
            <li key={j}>{renderInlineSegments(item, `li${j}`)}</li>
          ))}
        </ol>
      )
      continue
    }

    nodes.push(
      <Fragment key={key++}>
        {nodes.length > 0 && <br />}
        {renderInlineSegments(line, `p${i}`)}
      </Fragment>
    )
    i++
  }

  return nodes
}

export function FlowMarkdown({ text, variant }: FlowMarkdownProps): ReactElement | null {
  if (!text) return null
  return <>{variant === "block" ? renderBlock(text) : renderInlineOnly(text)}</>
}

/** Plain-text projection of the same restricted syntax, for dual-use config strings that
 *  also feed an `aria-label`/`title` attribute alongside the visible markdown rendering. */
export function stripMarkdownToPlainText(text: string | undefined): string {
  if (!text) return ""
  return text
    .split("\n")
    .map(stripListMarker)
    .map((line) =>
      line
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    )
    .join(" ")
    .trim()
}
