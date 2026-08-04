// Barrel re-export: this file used to hold all of the flow engine's state/navigation/
// path-resolution/validation logic in one place. Split (refactor audit, 2026-08-04)
// into flow-state.ts (FlowState + basic CRUD), flow-validation.ts (isStepValid and
// friends), flow-navigation.ts (next/prev/goToStep/canGoNext/canGoBack), flow-path.ts
// (branch resolution, resolved-path progress, CurrentStepInfo) and
// flow-initial-state.ts (computeInitialFlowState, setAnswerAndInvalidateDownstream) —
// each a more focused, individually easier to follow module. Every name this file used
// to export directly is still exported from here, so nothing importing from "./machine"
// (internal core files, or a consumer somehow reaching past the package's public "."
// entry) needs to change.
export * from "./flow-state"
export * from "./flow-validation"
export * from "./flow-navigation"
export * from "./flow-path"
export * from "./flow-initial-state"
