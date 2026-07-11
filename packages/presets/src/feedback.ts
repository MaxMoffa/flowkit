import { parseFlow, type Flow } from "@flowkit-io/core"

/** Post-experience feedback collection preset with NPS. */
export const feedbackFlow: Flow = parseFlow({
  id: "feedback",
  title: "Lascia un feedback",
  steps: [
    {
      id: "intro",
      type: "intro",
      title: "Com'è andata?",
      subtitle: "Il tuo feedback ci aiuta a migliorare.",
      emoji: "💬",
      cta: "Inizia",
    },
    {
      id: "mood",
      type: "faces",
      title: "Come valuti l'esperienza complessiva?",
    },
    {
      id: "nps",
      type: "nps",
      title: "Ci consiglieresti?",
      question: "Quanto è probabile che ci consiglieresti a un amico o collega?",
    },
    {
      id: "highlights",
      type: "multi-select",
      title: "Cosa ti è piaciuto di più?",
      min: 0,
      options: [
        { value: "speed", label: "Velocità" },
        { value: "support", label: "Assistenza" },
        { value: "design", label: "Design" },
        { value: "price", label: "Prezzo" },
      ],
    },
    {
      id: "email",
      type: "text",
      title: "Vuoi essere ricontattato?",
      required: false,
      variant: "email",
      placeholder: "nome@esempio.com",
    },
    {
      id: "review",
      type: "review",
      title: "Rivedi il tuo feedback",
    },
    {
      id: "confirmation",
      type: "confirmation",
      title: "Grazie per il tuo tempo!",
      message: "Il feedback è stato registrato.",
      emoji: "🙏",
    },
  ],
})
