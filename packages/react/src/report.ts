import { buildReportRows } from "@flowkit-io/core"
import type { Answers, Flow } from "@flowkit-io/core"

export interface RenderAnswersReportHtmlOptions {
  documentTitle?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Renders the same "resoconto" row/list markup as the review step (`.fk-review-box`,
 * `.fk-review-list`, `.fk-review-row`) as a standalone HTML string, embedding actual
 * `<img>` thumbnails for any image captured by a media/file step. Usable outside the
 * built-in FlowRunner UI (e.g. to build a custom export/share flow): the consumer's page
 * must also load @flowkit-io/react/style.css (or render inside a `.fk-theme` scope) for
 * the box/list/icon classes to be styled.
 */
export function renderAnswersReportHtml(
  flow: Flow,
  answers: Answers,
  options: RenderAnswersReportHtmlOptions = {},
): string {
  const rows = buildReportRows(flow, answers)
  const rowsHtml = rows
    .map((row) => {
      const mediaHtml = row.media?.length
        ? `<div class="fk-review-media">${row.media
            .map((item) => `<img src="${item.dataUrl}" alt="" />`)
            .join("")}</div>`
        : ""
      return `<div class="fk-review-row"><span class="fk-review-icon">${escapeHtml(row.icon)}</span><div><dt>${escapeHtml(row.title)}</dt><dd>${escapeHtml(row.value)}</dd>${mediaHtml}</div></div>`
    })
    .join("")

  const title = options.documentTitle ?? flow.title
  return `<div class="fk-review-box">${title ? `<h1>${escapeHtml(title)}</h1>` : ""}<dl class="fk-review-list">${rowsHtml}</dl></div>`
}
