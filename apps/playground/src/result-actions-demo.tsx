import { parseFlow, type Answers, type Flow } from "@flowkit-io/core"
import { createLocalAdapter, createReceiptEmailAdapter } from "@flowkit-io/adapters"

/**
 * Demo che collega i 4 resultActions della confirmation a veri adapter:
 * pdfExport/nativeShare non richiedono callback (solo API browser), mentre
 * resultLink/emailApi mostrano il pattern di iniezione di funzioni nella
 * config dello step, così @flowkit-io/react resta disaccoppiato da
 * @flowkit-io/adapters. L'endpoint di emailApi (/api, relativo) non esiste
 * davvero in questa demo: in dev la richiesta fallirà mostrando lo stato di
 * errore, nei test e2e viene intercettata con page.route.
 */
const demoAdapter = createLocalAdapter({ namespace: "flowkit-playground-result-actions" })
const receiptEmailAdapter = createReceiptEmailAdapter({ baseUrl: "/api" })

export const resultActionsDemoFlow: Flow = parseFlow({
  id: "result-actions-demo",
  title: "Azioni sul risultato",
  steps: [
    {
      id: "welcome",
      type: "intro",
      title: "Azioni sul risultato",
      subtitle: "PDF, link condivisibile, native share, invio email via API.",
      cta: "Prova",
    },
    {
      id: "feedback",
      type: "scale",
      title: "Quanto sei soddisfatto?",
      min: 1,
      max: 5,
    },
    {
      id: "end",
      type: "confirmation",
      title: "Grazie!",
      message: "Scegli come vuoi gestire il risultato.",
      resultActions: {
        pdfExport: { enabled: true, buttonLabel: "Scarica PDF" },
        nativeShare: { enabled: true, buttonLabel: "Condividi" },
        resultLink: {
          enabled: true,
          buttonLabel: "Genera link",
          helpText: "Crea un link univoco per rivedere le risposte in seguito.",
          createLink: (answers: Answers) => demoAdapter.createResultLink!("result-actions-demo", answers),
        },
        emailApi: {
          enabled: true,
          buttonLabel: "Invia via email (server)",
          helpText: "Il server ti invierà una copia via email.",
          sendEmail: (email: string, answers: Answers) =>
            receiptEmailAdapter.sendReceiptEmail("result-actions-demo", email, answers),
        },
      },
    },
  ],
})
