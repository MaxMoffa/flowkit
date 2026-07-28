import { parseFlow, type Flow } from "@flowkit-io/core"

// 1x1 transparent PNG: tiny, deterministic, no network dependency for the image demo.
const PIXEL_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

/** Demo for the "media-display" step (read-only image/video, not upload). */
export const mediaDisplayDemoFlow: Flow = parseFlow({
  id: "media-display-demo",
  title: "Media di sola visualizzazione",
  steps: [
    { id: "welcome", type: "intro", title: "Guarda prima di rispondere", cta: "Prova" },
    {
      id: "photo",
      type: "media-display",
      title: "Cosa ne pensi di questa foto?",
      kind: "image",
      src: PIXEL_PNG,
      alt: "Foto di esempio",
      caption: "Foto scattata durante l'evento.",
      required: false,
    },
    {
      id: "opinion",
      type: "text",
      title: "Raccontaci la tua opinione",
      required: false,
    },
    {
      id: "clip",
      type: "media-display",
      title: "Guarda questo video",
      kind: "video",
      src: "/media-demo/sample.mp4",
      muted: true,
      autoplay: true,
      controls: true,
      caption: "Video di esempio (autoplay silenzioso).",
      required: false,
    },
    { id: "end", type: "confirmation", title: "Grazie!", showHomeButton: false },
  ],
})
