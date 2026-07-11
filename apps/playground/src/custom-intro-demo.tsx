import { z } from "zod"
import { registerStepType, parseFlow, type Flow } from "@flowkit-io/core"
import { registerStepComponent, type StepComponentProps } from "@flowkit-io/react"

/**
 * Esempio end-to-end di intro/confirmation completamente custom (v2.9): nuovi
 * tipi "intro-hero" e "confirmation-hero" vengono registrati con role
 * "intro"/"confirmation" cosi' FlowRunner nasconde l'header e guida il CTA/footer
 * sticky esattamente come per lo step standard, ma il corpo del contenuto e'
 * JSX libero — utile per chi vuole farne una mini landing page.
 */

const introHeroStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("intro-hero"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(),
  cta: z.string().default("Inizia"),
  heroImage: z.string().optional(),
  badgeText: z.string().optional(),
  headline: z.string(),
  testimonial: z.string().optional(),
})

export type IntroHeroStep = z.infer<typeof introHeroStepSchema>

declare module "@flowkit-io/core" {
  interface StepTypeMap {
    "intro-hero": IntroHeroStep
  }
}

registerStepType({
  type: "intro-hero",
  schema: introHeroStepSchema,
  validate: () => true,
  role: "intro",
})

function IntroHeroView({ step }: StepComponentProps<IntroHeroStep>) {
  return (
    <div className="fk-step fk-step-intro-hero">
      {step.badgeText && <div className="fk-intro-pill">{step.badgeText}</div>}
      {step.heroImage && <div className="fk-intro-hero-image">{step.heroImage}</div>}
      <h1 className="fk-title">{step.headline}</h1>
      {step.testimonial && <blockquote className="fk-intro-hero-quote">“{step.testimonial}”</blockquote>}
    </div>
  )
}

registerStepComponent("intro-hero", IntroHeroView)

const confirmationHeroStepSchema = z.object({
  id: z.string().min(1),
  type: z.literal("confirmation-hero"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  required: z.boolean().default(true),
  icon: z.string().optional(),
  primaryCta: z.string().optional(),
  secondaryCta: z.string().optional(),
  heroImage: z.string().optional(),
  shareMessage: z.string().optional(),
  headline: z.string(),
})

export type ConfirmationHeroStep = z.infer<typeof confirmationHeroStepSchema>

declare module "@flowkit-io/core" {
  interface StepTypeMap {
    "confirmation-hero": ConfirmationHeroStep
  }
}

registerStepType({
  type: "confirmation-hero",
  schema: confirmationHeroStepSchema,
  validate: () => true,
  role: "confirmation",
})

function ConfirmationHeroView({ step }: StepComponentProps<ConfirmationHeroStep>) {
  return (
    <div className="fk-step fk-step-confirmation-hero">
      {step.heroImage && <div className="fk-intro-hero-image">{step.heroImage}</div>}
      <h1 className="fk-title">{step.headline}</h1>
      {step.shareMessage && <p className="fk-subtitle">{step.shareMessage}</p>}
    </div>
  )
}

registerStepComponent("confirmation-hero", ConfirmationHeroView)

export const customIntroDemoFlow: Flow = parseFlow({
  id: "custom-intro-demo",
  title: "Intro & conferma custom",
  steps: [
    {
      id: "welcome",
      type: "intro-hero",
      cta: "Scopri di più",
      badgeText: "🔴 Live",
      heroImage: "🚀",
      headline: "Costruisci mini landing page dentro il tuo flow",
      testimonial: "Con role: 'intro' puoi sostituire tutto il contenuto sopra il CTA.",
    },
    { id: "rating", type: "faces", title: "Come valuti questa demo?" },
    {
      id: "end",
      type: "confirmation-hero",
      headline: "Fatto! Grazie per aver provato la demo.",
      heroImage: "🎉",
      shareMessage: "Anche la schermata finale è completamente personalizzabile.",
      primaryCta: "Torna alla home",
      secondaryCta: "Rifai la demo",
    },
  ],
})
