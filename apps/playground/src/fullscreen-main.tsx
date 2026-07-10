import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@flowkit/react/style.css"
import "./playground.css"
import { FullscreenPreview } from "./FullscreenPreview"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FullscreenPreview />
  </StrictMode>,
)
