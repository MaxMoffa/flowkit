import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@flowkit-io/react/style.css"
import "./playground.css"
import { App } from "./app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
