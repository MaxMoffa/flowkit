import { buildReportRows } from "@flowkit-io/core"
import type { Answers, Flow } from "@flowkit-io/core"
import { ReportRows } from "../shared/ReportRows"
import type { PdfExportConfig } from "./types"

interface PdfExportActionProps {
  config: PdfExportConfig
  fallbackTitle: string
  flow: Flow
  answers: Answers
}

/** Print button plus the `.fk-print-recap` block, hidden on screen and laid out for paper
 *  by the print stylesheet: "export to PDF" is the browser's own print-to-PDF. */
export function PdfExportAction({ config, fallbackTitle, flow, answers }: PdfExportActionProps) {
  return (
    <>
      <button type="button" className="fk-btn-neutral fk-pdf-export-btn" onClick={() => window.print()}>
        {config.buttonLabel}
      </button>
      <div className="fk-print-recap">
        <h1>{config.documentTitle ?? fallbackTitle}</h1>
        <ReportRows rows={buildReportRows(flow, answers)} />
      </div>
    </>
  )
}
