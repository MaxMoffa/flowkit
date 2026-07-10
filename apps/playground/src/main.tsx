import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@flowkit/react/style.css"
import "@flowkit/react/map-maplibre"
import "@flowkit/react/map-leaflet"
import "./playground.css"
import { App } from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
