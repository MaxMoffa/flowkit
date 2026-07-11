import { z } from "zod"
import { registerStepType, parseFlow, type Flow } from "@flowkit-io/core"
import { registerStepComponent, type StepComponentProps } from "@flowkit-io/react"

/**
 * Esempio end-to-end dell'API di step custom (v2.2): un nuovo tipo "rating-stars"
 * viene registrato lato core (schema + validazione) e lato react (componente),
 * poi usato in un preset di test come uno qualsiasi dei 12 step built-in.
 */

const ratingStarsStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("rating-stars"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(),
  maxStars: z.number().default(5),
})

export type RatingStarsStep = z.infer<typeof ratingStarsStepSchema>

declare module "@flowkit-io/core" {
  interface StepTypeMap {
    "rating-stars": RatingStarsStep
  }
}

registerStepType({
  type: "rating-stars",
  schema: ratingStarsStepSchema,
  validate: (_step, value) => typeof value === "number" && value > 0,
})

function RatingStarsView({ step, value, onChange }: StepComponentProps<RatingStarsStep>) {
  const current = typeof value === "number" ? value : 0
  const stars = Array.from({ length: step.maxStars }, (_, i) => i + 1)
  return (
    <div className="fk-step fk-step-rating-stars">
      {step.title && <h2 className="fk-title">{step.title}</h2>}
      {step.subtitle && <p className="fk-subtitle">{step.subtitle}</p>}
      <div className="fk-rating-stars" role="radiogroup" aria-label={step.title ?? "Valutazione"}>
        {stars.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n <= current}
            className="fk-rating-star"
            onClick={() => onChange(n)}
          >
            {n <= current ? "⭐" : "☆"}
          </button>
        ))}
      </div>
    </div>
  )
}

registerStepComponent("rating-stars", RatingStarsView)

export const customStepDemoFlow: Flow = parseFlow({
  id: "custom-step-demo",
  title: "Step personalizzati",
  steps: [
    { id: "welcome", type: "intro", title: "Step custom", cta: "Prova" },
    {
      id: "rating",
      type: "rating-stars",
      title: "Quante stelle dai a flowkit?",
      maxStars: 5,
    },
    { id: "end", type: "confirmation", title: "Grazie!" },
  ],
})
