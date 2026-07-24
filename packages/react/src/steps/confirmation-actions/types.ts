import type { ConfirmationStep } from "@flowkit-io/core"

/** Each action below is rendered only when its own `enabled` flag is set, so the
 *  components take their slice of the config already narrowed. */
type ResultActions = NonNullable<ConfirmationStep["resultActions"]>

export type EmailShareConfig = NonNullable<ConfirmationStep["emailShare"]>
export type ResultLinkConfig = NonNullable<ResultActions["resultLink"]>
export type EmailApiConfig = NonNullable<ResultActions["emailApi"]>
export type NativeShareConfig = NonNullable<ResultActions["nativeShare"]>
export type PdfExportConfig = NonNullable<ResultActions["pdfExport"]>
