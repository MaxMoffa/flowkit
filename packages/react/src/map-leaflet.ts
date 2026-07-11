// Separate entry: those who don't use the "location-leaflet" step shouldn't download leaflet.
// import "@flowkit-io/react/map-leaflet" to register the component.
import { registerStepComponent } from "./registry"
import { LocationLeafletStepView } from "./steps/location-leaflet"

registerStepComponent("location-leaflet", LocationLeafletStepView)
