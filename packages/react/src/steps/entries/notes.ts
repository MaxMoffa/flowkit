// Opt-in entry: import "@flowkit-io/react/steps/notes" to register only this step.
import { registerStepComponent } from "../../registry"
import { NotesStepView } from "../notes"

registerStepComponent("notes", NotesStepView)
