import { registerStepComponent } from "../registry"
import { IntroStepView } from "./intro"
import { SelectCardsStepView } from "./select-cards"
import { ScaleStepView } from "./scale"
import { ChipsStepView } from "./chips"
import { FacesStepView } from "./faces"
import { NotesStepView } from "./notes"
import { PhotoStepView } from "./photo"
import { DateTimeStepView } from "./date-time"
import { NpsStepView } from "./nps"
import { MultiSelectStepView } from "./multi-select"
import { TextStepView } from "./text"
import { ReviewStepView } from "./review"
import { ConfirmationStepView } from "./confirmation"
import { OAuthStepView } from "./oauth"
import { GroupStepView } from "./group"

registerStepComponent("intro", IntroStepView)
registerStepComponent("select-cards", SelectCardsStepView)
registerStepComponent("scale", ScaleStepView)
registerStepComponent("chips", ChipsStepView)
registerStepComponent("faces", FacesStepView)
registerStepComponent("notes", NotesStepView)
registerStepComponent("photo", PhotoStepView)
registerStepComponent("date-time", DateTimeStepView)
registerStepComponent("nps", NpsStepView)
registerStepComponent("multi-select", MultiSelectStepView)
registerStepComponent("text", TextStepView)
registerStepComponent("review", ReviewStepView)
registerStepComponent("confirmation", ConfirmationStepView)
registerStepComponent("oauth", OAuthStepView)
registerStepComponent("group", GroupStepView)
