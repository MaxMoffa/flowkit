import { parseFlow, type Flow, type CalculateTax } from "@flowkit-io/core"

/**
 * Demo dello step `product` (hero, 1-4 articoli) — il fratello "vetrina" di
 * `catalog`: un `intro`, poi un primo step `product` con un solo articolo (una card
 * grande), poi un secondo step `product` con 3 articoli (stessa card, in lista
 * verticale), pagamento `payment-stripe` con `amountSource: "cart"` che somma
 * entrambi (stesso meccanismo di `buildOrderSummary` del carrello).
 *
 * `calculateTax` qui è un mock (IVA 22% esclusa), come in catalog-demo.tsx.
 */
const MOCK_TAX_RATE = 0.22
const mockCalculateTax: CalculateTax = async (input) => {
  const base = input.lines.reduce((sum, line) => sum + line.amount, 0)
  const taxAmount = Math.round(base * MOCK_TAX_RATE)
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

export const productDemoFlow: Flow = parseFlow({
  id: "product-demo",
  title: "Vetrina prodotto",
  steps: [
    { id: "welcome", type: "intro", title: "Guarda la nostra maglietta", cta: "Inizia" },
    {
      id: "solo",
      key: "solo",
      type: "product",
      title: "T-shirt FlowKit",
      subtitle: "Un solo articolo: card hero grande, in evidenza.",
      currency: "eur",
      items: [
        {
          value: "tshirt",
          label: "T-shirt FlowKit",
          description: "100% cotone, stampa serigrafica.",
          details:
            "**Cotone organico 180 g/m²**, filato ring-spun. Stampa serigrafica a base acqua, resistente a oltre 50 lavaggi.\n\nVestibilità regular unisex. Taglie **S–XXL**.\n\nSpedizione in 3-5 giorni lavorativi, reso gratuito entro 30 giorni.",
          price: 2500,
          image: { kind: "emoji", value: "👕" },
          maxQuantity: 5,
        },
      ],
    },
    {
      id: "addons",
      key: "addons",
      type: "product",
      title: "Vuoi aggiungere altro?",
      subtitle: "Fino a 4 articoli: stessa card hero, in lista verticale.",
      currency: "eur",
      items: [
        {
          value: "mug",
          label: "Tazza",
          description: "Ceramica, 350 ml.",
          details: "Ceramica smaltata, **350 ml**. Adatta a lavastoviglie e microonde.",
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
        "Demo pubblica: l'importo somma entrambi gli step product. Nessun addebito reale (niente backend).",
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
