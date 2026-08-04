import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@flowkit-io/react/style.css"
import "./playground.css"
import { FullscreenPreview } from "./fullscreen-preview"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FullscreenPreview />
  </StrictMode>,
)
