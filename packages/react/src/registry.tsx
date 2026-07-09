import type { Step, StepType } from "@flowkit/core"
import type { ComponentType } from "react"
import type { StepComponentProps } from "./types"
import { IntroStepView } from "./steps/intro"
import { LocationStepView } from "./steps/location"
import { SelectCardsStepView } from "./steps/select-cards"
import { ScaleStepView } from "./steps/scale"
import { ChipsStepView } from "./steps/chips"
import { FacesStepView } from "./steps/faces"
import { NotesPhotoStepView } from "./steps/notes-photo"
import { NpsStepView } from "./steps/nps"
import { MultiSelectStepView } from "./steps/multi-select"
import { TextStepView } from "./steps/text"
import { ReviewStepView } from "./steps/review"
import { ConfirmationStepView } from "./steps/confirmation"

export const stepRegistry: Record<StepType, ComponentType<StepComponentProps<Step>>> = {
  intro: IntroStepView as ComponentType<StepComponentProps<Step>>,
  location: LocationStepView as ComponentType<StepComponentProps<Step>>,
  "select-cards": SelectCardsStepView as ComponentType<StepComponentProps<Step>>,
  scale: ScaleStepView as ComponentType<StepComponentProps<Step>>,
  chips: ChipsStepView as ComponentType<StepComponentProps<Step>>,
  faces: FacesStepView as ComponentType<StepComponentProps<Step>>,
  "notes-photo": NotesPhotoStepView as ComponentType<StepComponentProps<Step>>,
  nps: NpsStepView as ComponentType<StepComponentProps<Step>>,
  "multi-select": MultiSelectStepView as ComponentType<StepComponentProps<Step>>,
  text: TextStepView as ComponentType<StepComponentProps<Step>>,
  review: ReviewStepView as ComponentType<StepComponentProps<Step>>,
  confirmation: ConfirmationStepView as ComponentType<StepComponentProps<Step>>,
}
