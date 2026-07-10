import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@flowkit/react/style.css"
import "@flowkit/react/map-maplibre"
import "@flowkit/react/map-leaflet"
import "./playground.css"
import { FullscreenPreview } from "./FullscreenPreview"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FullscreenPreview />
  </StrictMode>,
)
