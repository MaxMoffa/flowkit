import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { FlowMarkdown, stripMarkdownToPlainText } from "./markdown"

describe("FlowMarkdown", () => {
  it("returns null for empty/undefined text", () => {
    expect(render(<FlowMarkdown text={undefined} variant="inline" />).container.textContent).toBe("")
    expect(render(<FlowMarkdown text="" variant="inline" />).container.textContent).toBe("")
  })

  describe("allowed elements render correctly", () => {
    it("renders bold", () => {
      const { container } = render(<FlowMarkdown text="**hello**" variant="inline" />)
      const strong = container.querySelector("strong")
      expect(strong).not.toBeNull()
      expect(strong?.textContent).toBe("hello")
    })

    it("renders italic with * and _", () => {
      const a = render(<FlowMarkdown text="*hi*" variant="inline" />)
      expect(a.container.querySelector("em")?.textContent).toBe("hi")
      const b = render(<FlowMarkdown text="_hi_" variant="inline" />)
      expect(b.container.querySelector("em")?.textContent).toBe("hi")
    })

    it("renders a safe link with target/rel for external urls", () => {
      const { container } = render(<FlowMarkdown text="[go](https://example.com)" variant="inline" />)
      const a = container.querySelector("a")
      expect(a).not.toBeNull()
      expect(a?.getAttribute("href")).toBe("https://example.com")
      expect(a?.getAttribute("target")).toBe("_blank")
      expect(a?.getAttribute("rel")).toBe("noopener noreferrer")
    })

    it("renders mailto/relative/hash links without target=_blank", () => {
      const { container } = render(<FlowMarkdown text="[mail](mailto:a@b.com)" variant="inline" />)
      const a = container.querySelector("a")
      expect(a?.getAttribute("target")).toBeNull()
    })

    it("renders bullet and numbered lists in block variant", () => {
      const { container } = render(<FlowMarkdown text={"- a\n- b"} variant="block" />)
      expect(container.querySelectorAll("ul li")).toHaveLength(2)

      const { container: c2 } = render(<FlowMarkdown text={"1. a\n2. b"} variant="block" />)
      expect(c2.querySelectorAll("ol li")).toHaveLength(2)
    })
  })

  describe("disallowed elements are never interpreted", () => {
    it("renders headings/code fences/raw html as literal text", () => {
      const { container } = render(
        <FlowMarkdown text={"# Heading\n```code```\n<img src=x>\n<script>alert(1)</script>"} variant="block" />
      )
      expect(container.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull()
      expect(container.querySelector("code, pre")).toBeNull()
      expect(container.querySelector("img")).toBeNull()
      expect(container.querySelector("script")).toBeNull()
      expect(container.textContent).toContain("# Heading")
      expect(container.textContent).toContain("<img src=x>")
    })
  })

  describe("inline variant degrades lists to plain text", () => {
    it("never emits list elements", () => {
      const { container } = render(<FlowMarkdown text={"- a\n- b"} variant="inline" />)
      expect(container.querySelector("ul, ol, li")).toBeNull()
      expect(container.textContent).toContain("a")
      expect(container.textContent).toContain("b")
    })
  })

  describe("malicious input is sanitized", () => {
    it("renders a javascript: link as inert plain text, not an anchor", () => {
      const { container } = render(<FlowMarkdown text="[click](javascript:alert(1))" variant="inline" />)
      expect(container.querySelector("a")).toBeNull()
      expect(container.textContent).toContain("click")
    })

    it("rejects data: links", () => {
      const { container } = render(<FlowMarkdown text="[x](data:text/html,<script>alert(1)</script>)" variant="inline" />)
      expect(container.querySelector("a")).toBeNull()
    })

    it("renders img/script tags as inert literal text, never as real elements", () => {
      const { container } = render(
        <FlowMarkdown text={'<img src=x onerror="alert(1)">'} variant="block" />
      )
      expect(container.querySelector("img")).toBeNull()
      expect(container.textContent).toContain("<img src=x onerror=\"alert(1)\">")
    })
  })
})

describe("stripMarkdownToPlainText", () => {
  it("strips bold/italic/link syntax and list markers", () => {
    expect(stripMarkdownToPlainText("**bold** and *italic* and [link](https://x.com)")).toBe(
      "bold and italic and link"
    )
    expect(stripMarkdownToPlainText("- a\n- b")).toBe("a b")
  })

  it("returns empty string for undefined", () => {
    expect(stripMarkdownToPlainText(undefined)).toBe("")
  })
})
