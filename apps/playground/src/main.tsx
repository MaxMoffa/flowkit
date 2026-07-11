import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@flowkit-io/react/style.css"
import "@flowkit-io/react/map-maplibre"
import "@flowkit-io/react/map-leaflet"
import "./playground.css"
import { App } from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
