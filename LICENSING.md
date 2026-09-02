# FlowKit licensing — plain-language guide

This is a **non-binding** summary. The binding terms are in
[`LICENSE.md`](./LICENSE.md) (**PolyForm Shield License 1.0.0**). If they conflict with
this page, they win.

## TL;DR

- **FlowKit 1.0.0 and later** is source-available under the **PolyForm Shield License
  1.0.0** — a standard, lawyer-drafted license from
  [polyformproject.org](https://polyformproject.org/licenses/shield/1.0.0/).
- You can read, build, modify, redistribute and run FlowKit in production —
  **for free** — for **any purpose except competing** with **FlowKit** or with
  **Flowlab** (the platform the maintainer builds on FlowKit).
- There is **no time limit and no conversion**: the license does not turn into
  Apache 2.0, MIT, or anything else. It stays in effect permanently, unless you
  obtain a separate commercial license or violate the terms.
- **FlowKit 0.x** stays **MIT** forever. Nothing about 0.x changes — it is just no
  longer maintained.

## Which version am I using?

| Version | License | Maintained? |
| --- | --- | --- |
| `@flowkit-io/*` **< 1.0.0** (the `0.x` line) | MIT (permanent, unchanged) | No — legacy |
| `@flowkit-io/*` **>= 1.0.0** | PolyForm Shield 1.0.0 (permanent, no conversion) | Yes |

The license is **not retroactive**: adopting PolyForm Shield for 1.0.0 does not touch
the rights you already have in any 0.x release you downloaded.

## Allowed (no permission or payment needed)

- **Personal, internal-business, educational, academic and research** use.
- **Using FlowKit as a dependency** inside your own app, website or product —
  including commercial products — as long as that product does not compete with
  FlowKit or Flowlab.
- **Copying, modifying, forking and redistributing** the source, keeping the
  PolyForm Shield license and the `Required Notice:` line with it.
- Building and selling **plugins, adapters, integrations, connectors, themes,
  custom step types and extensions** for FlowKit.
- **Consulting, development, training and support** services around FlowKit.
- Running **self-hosted internal deployments** for your own organisation.

## Not allowed without a commercial license

The license's **Noncompete** term forbids using FlowKit to provide *any product that
competes* with FlowKit, or with any product the maintainer or its affiliates provides
using FlowKit (i.e. **Flowlab**). Per the license's **Competition** term, this is broad:
an app can compete with a service, a library with a plugin, a self-hosted tool with a
hosted one — regardless of interface, platform, language, or price (free included).
Concretely, you may not, without a commercial license:

- Offer a **hosted, managed, cloud, embedded, OEM, self-hosted or white-label**
  product or service that lets third parties build, publish, host or collect
  responses for guided flows / multi-step forms / surveys and thereby competes
  with or substitutes for Flowlab.
- Ship a **general-purpose flow / form / survey / onboarding builder** positioned
  as an alternative to Flowlab.
- Re-sell FlowKit itself, or a trivially-wrapped FlowKit, as your product.

If you need any of these, see [`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md).

## Flowlab examples

**Flowlab** is the multi-tenant no-code platform the FlowKit maintainer operates
(create, publish, host, fill, collect and export guided flows without code),
built on FlowKit. `LICENSE.md` names it as the maintainer's line of business, so the
protection persists even if Flowlab were discontinued.

| Scenario | Allowed under PolyForm Shield 1.0.0? |
| --- | --- |
| A tour operator embeds `<FlowRunner>` in their own booking site | ✅ Yes — FlowKit is a dependency of a non-competing product |
| An agency builds client intake flows for hire using FlowKit | ✅ Yes — consulting |
| A developer publishes `@acme/flowkit-airtable-adapter` on npm | ✅ Yes — adapter |
| A SaaS launches "FormForge", a hosted drag-and-drop form builder built on FlowKit, sold to the public | ❌ No — competes with Flowlab |
| A company offers a white-label "survey platform" OEM'd to resellers, powered by FlowKit | ❌ No — white-label competing offering |
| A team runs an internal-only flow builder for their own staff on FlowKit | ✅ Yes — internal use |
| Someone builds their own flow library from scratch, or uses a different one | ✅ Yes — the license covers FlowKit's code, not the idea |

## Why the competing-use restriction is permanent

FlowKit funds its development through Flowlab. The restriction exists to keep a third
party from using FlowKit's own code to undercut Flowlab. Unlike a time-limited license
(BSL / FSL), PolyForm Shield does **not** expire and does **not** convert to an
open-source license — a competitor cannot simply wait it out. The maintainer holds the
copyright and can always choose to relicense FlowKit more permissively later; the
permanent term keeps that a choice, not an obligation.

Note: PolyForm Shield is a **source-available** license, not an OSI-approved open-source
license.

## Questions

Email **massimomoffa02@gmail.com** with "FlowKit licensing" in the subject.
Describe what you want to build; most uses are already allowed for free.
