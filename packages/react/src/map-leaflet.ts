// Entry separato: chi non usa lo step "location-leaflet" non deve scaricare leaflet.
// import "@flowkit/react/map-leaflet" per registrare il componente.
import { registerStepComponent } from "./registry"
import { LocationLeafletStepView } from "./steps/location-leaflet"

registerStepComponent("location-leaflet", LocationLeafletStepView)
