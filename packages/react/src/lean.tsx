/**
 * Same public API as the main entry, minus the built-in step registrations.
 *
 * Importing "@flowkit-io/react" registers all 18 built-in step components, so a flow
 * using three of them still ships eighteen. This entry registers none: pick the ones
 * you use from "@flowkit-io/react/steps/<type>".
 *
 *   import { FlowRunner } from "@flowkit-io/react/lean"
 *   import "@flowkit-io/react/steps/intro"
 *   import "@flowkit-io/react/steps/text"
 *   import "@flowkit-io/react/steps/confirmation"
 *
 * FlowRunner throws a descriptive error if it meets a step type nobody registered.
 * The progress components stay bundled: they are part of the chrome, not of any step,
 * and FlowRunner falls back to the bar variant.
 */
export { FlowRunner } from "./FlowRunner"
export type { FlowRunnerProps } from "./FlowRunner"
export { ThemeProvider } from "./ThemeProvider"
export { stepRegistry, registerStepComponent, getStepComponent } from "./registry"
export type { StepComponentProps, FlowSubmitHandler } from "./types"
export { registerProgressComponent, getProgressComponent } from "./progress-registry"
export type { ProgressComponentProps } from "./progress-registry"
export { renderReceiptEmailHtml } from "./email-templates/receipt-email"
export type { ReceiptEmailTemplateOptions } from "./email-templates/receipt-email"
export { renderAnswersReportHtml } from "./report"
export type { RenderAnswersReportHtmlOptions } from "./report"
import "./progress/builtins"
