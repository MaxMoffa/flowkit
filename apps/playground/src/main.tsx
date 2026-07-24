import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@flowkit-io/react/style.css"
import "@flowkit-io/react/map-maplibre"
import "@flowkit-io/react/map-leaflet"
import "@flowkit-io/react/payment-stripe"
import "./playground.css"
import { App } from "./app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
