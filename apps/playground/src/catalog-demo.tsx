import { parseFlow, type Flow, type CalculateTax } from "@flowkit-io/core"

/**
 * Demo del carrello (v2.42): lo step `catalog` fa scegliere prodotti e quantità,
 * lo step `payment-stripe` con `amountSource: "cart"` addebita la somma calcolata
 * automaticamente, e il review mostra il totale prima dell'invio.
 *
 * `calculateTax` qui è un mock (IVA 22% esclusa) al posto della funzione che la
 * piattaforma inietterebbe chiamando `POST /v1/tax/calculations` su Stripe.
 */
const MOCK_TAX_RATE = 0.22
const mockCalculateTax: CalculateTax = async (input) => {
  const base = input.lines.reduce((sum, line) => sum + line.amount, 0)
  const taxAmount = Math.round(base * MOCK_TAX_RATE)
  // Simula la latenza di rete della chiamata a Stripe.
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    taxAmount,
    totalWithTax: base + taxAmount,
    currency: input.currency,
    breakdown: [
      {
        label: `IVA ${Math.round(MOCK_TAX_RATE * 100)}% (${input.address.country || "IT"})`,
        rate: MOCK_TAX_RATE,
        amount: taxAmount,
      },
    ],
  }
}
export const catalogDemoFlow: Flow = parseFlow({
  id: "catalog-demo",
  title: "Carrello + pagamento",
  steps: [
    { id: "welcome", type: "intro", title: "Ordina la merce", cta: "Inizia" },
    {
      id: "cart",
      key: "cart",
      type: "catalog",
      title: "Scegli i prodotti",
      subtitle: "Aggiungi quello che vuoi e regola la quantità.",
      currency: "eur",
      maxPerItem: 10,
      minItems: 1,
      items: [
        {
          value: "tshirt",
          label: "T-shirt FlowKit",
          description: "100% cotone, stampa serigrafica.",
          details:
            "**Cotone organico 180 g/m²**, filato ring-spun. Stampa serigrafica a base acqua, resistente a oltre 50 lavaggi.\n\nVestibilità regular unisex. Taglie **S–XXL**. Lavaggio a 30°, non asciugare in asciugatrice, stira a rovescio.\n\nSpedizione in 3-5 giorni lavorativi, reso gratuito entro 30 giorni.",
          price: 2500,
          image: { kind: "emoji", value: "👕" },
        },
        {
          value: "mug",
          label: "Tazza",
          description: "Ceramica, 350 ml.",
          details:
            "Ceramica smaltata, **350 ml**. Adatta a lavastoviglie e microonde.\n\nStampa del logo su entrambi i lati. Confezione singola in cartone riciclato.",
          price: 1200,
          image: { kind: "emoji", value: "☕" },
          maxQuantity: 4,
        },
        {
          value: "stickers",
          label: "Set di adesivi",
          description: "10 adesivi vinilici.",
          price: 500,
          image: { kind: "emoji", value: "✨" },
        },
        {
          value: "tote",
          label: "Borsa di tela",
          description: "Manici lunghi, tasca interna.",
          price: 1800,
          image: { kind: "emoji", value: "👜" },
        },
      ],
    },
    {
      id: "shipping",
      key: "shipping",
      type: "radio",
      title: "Spedizione",
      subtitle: "Il costo si somma al totale del carrello.",
      options: [
        { value: "standard", label: "Standard (3-5 giorni)", price: 0 },
        { value: "express", label: "Express (24h)", price: 700 },
      ],
    },
    {
      id: "address",
      key: "address",
      type: "address",
      title: "Indirizzo di fatturazione",
      subtitle: "Serve per calcolare l'IVA corretta.",
    },
    {
      id: "pay",
      key: "pay",
      type: "payment-stripe",
      title: "Completa il pagamento",
      subtitle:
        "Demo pubblica: l'importo è calcolato dal carrello + spedizione. Nessun addebito reale (niente backend).",
      amountSource: "cart",
      taxBehavior: "exclusive",
      calculateTax: mockCalculateTax,
      // Stripe's own well-known public test key — safe to embed, test-mode only.
      publishableKey: "pk_test_TYooMQauvdEDq54NiTphI7jx",
      currency: "eur",
      description: "Ordine demo FlowKit",
    },
    { id: "review", type: "review", title: "Controlla e paga" },
    { id: "done", type: "confirmation", title: "Ordine ricevuto!" },
  ],
})
