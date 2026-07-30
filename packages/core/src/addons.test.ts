import { describe, expect, it } from "vitest"
import { computeStepAddonValue, getSmartFillGenerator, listSmartFillGenerators } from "./addons"
import "./smart-fill-generators"

describe("smartFill add-on", () => {
  it("registers the built-in codiceFiscale generator", () => {
    expect(listSmartFillGenerators()).toContain("codiceFiscale")
  })

  it("computes a known codice fiscale (Mario Rossi, 1980-01-01, Roma, M)", () => {
    const generator = getSmartFillGenerator("codiceFiscale")!
    const value = generator.compute({
      nome: "Mario",
      cognome: "Rossi",
      dataNascita: "1980-01-01",
      luogoNascita: "H501",
      sesso: "M",
    })
    expect(value).toBe("RSSMRA80A01H501U")
  })

  it("shifts the day-of-birth code by 40 for sesso F", () => {
    const generator = getSmartFillGenerator("codiceFiscale")!
    const value = generator.compute({
      nome: "Maria",
      cognome: "Bianchi",
      dataNascita: "1980-01-01",
      luogoNascita: "H501",
      sesso: "F",
    })
    expect(value).toBe("BNCMRA80A41H501E")
  })

  it("returns undefined when luogoNascita isn't a Belfiore-shaped code", () => {
    const generator = getSmartFillGenerator("codiceFiscale")!
    expect(
      generator.compute({
        nome: "Mario",
        cognome: "Rossi",
        dataNascita: "1980-01-01",
        luogoNascita: "Roma",
        sesso: "M",
      }),
    ).toBeUndefined()
  })

  it("computeStepAddonValue resolves source fields from answers and returns undefined until all are filled", () => {
    const addon = {
      type: "smartFill" as const,
      generator: "codiceFiscale",
      sourceFields: {
        nome: "nome-step",
        cognome: "cognome-step",
        dataNascita: "dob-step",
        luogoNascita: "place-step",
        sesso: "sex-step",
      },
    }

    expect(computeStepAddonValue(addon, { "nome-step": "Mario" })).toBeUndefined()

    expect(
      computeStepAddonValue(addon, {
        "nome-step": "Mario",
        "cognome-step": "Rossi",
        "dob-step": "1980-01-01",
        "place-step": "H501",
        "sex-step": "M",
      }),
    ).toBe("RSSMRA80A01H501U")
  })

  it("returns undefined for an unregistered generator id", () => {
    expect(
      computeStepAddonValue(
        { type: "smartFill", generator: "does-not-exist", sourceFields: {} },
        {},
      ),
    ).toBeUndefined()
  })
})
