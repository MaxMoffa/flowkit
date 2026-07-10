// Entry separato: chi non usa lo step "location" non deve scaricare maplibre-gl.
// import "@flowkit/react/map-maplibre" per registrare il componente.
import { registerStepComponent } from "./registry"
import { LocationStepView } from "./steps/location"

registerStepComponent("location", LocationStepView)
