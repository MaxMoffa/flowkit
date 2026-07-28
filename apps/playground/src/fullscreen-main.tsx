import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@flowkit-io/react/style.css"
import "@flowkit-io/react/map-maplibre"
import "@flowkit-io/react/map-leaflet"
import "@flowkit-io/react/payment-stripe"
import "@flowkit-io/react/verification"
import "./playground.css"
import { FullscreenPreview } from "./fullscreen-preview"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FullscreenPreview />
  </StrictMode>,
)
