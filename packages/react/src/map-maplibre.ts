// Separate entry: those who don't use the "location" step shouldn't download maplibre-gl.
// import "@flowkit/react/map-maplibre" to register the component.
import { registerStepComponent } from "./registry"
import { LocationStepView } from "./steps/location"

registerStepComponent("location", LocationStepView)
