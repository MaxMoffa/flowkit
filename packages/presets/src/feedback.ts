import { parseFlow, type Flow } from "@flowkit-io/core"

/** Post-experience feedback collection preset with NPS. */
export const feedbackFlow: Flow = parseFlow({
  id: "feedback",
  title: "Lascia un feedback",
  steps: [
    {
      id: "intro",
      type: "intro",
      key: "com_andata",
      title: "Com'è andata?",
      subtitle: "Il tuo feedback ci aiuta a migliorare.",
      image: { kind: "emoji", value: "💬" },
      cta: "Inizia",
    },
    {
      id: "mood",
      type: "faces",
      key: "come_valuti_l_esperienza_complessiva",
      title: "Come valuti l'esperienza complessiva?",
      subtitle: "Scegli l'emoji che rappresenta meglio la tua sensazione.",
    },
    {
      id: "nps",
      type: "nps",
      key: "ci_consiglieresti",
      title: "Ci consiglieresti?",
      subtitle: "Da 0 (per niente probabile) a 10 (estremamente probabile).",
      question: "Quanto è probabile che ci consiglieresti a un amico o collega?",
    },
    {
      id: "highlights",
      type: "multi-select",
      key: "cosa_ti_piaciuto_di_pi",
      title: "Cosa ti è piaciuto di più?",
      subtitle: "Puoi selezionare più di un'opzione.",
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
      key: "vuoi_essere_ricontattato",
      title: "Vuoi essere ricontattato?",
      subtitle: "Facoltativo: lascia la tua email solo se desideri una risposta.",
      required: false,
      variant: "email",
      placeholder: "nome@esempio.com",
    },
    {
      id: "review",
      type: "review",
      key: "rivedi_il_tuo_feedback",
      title: "Rivedi il tuo feedback",
      subtitle: "Controlla le risposte prima di inviare.",
    },
    {
      id: "confirmation",
      type: "confirmation",
      key: "grazie_per_il_tuo_tempo",
      title: "Grazie per il tuo tempo!",
      message: "Il feedback è stato registrato.",
      image: { kind: "emoji", value: "🙏" },
    },
  ],
})
