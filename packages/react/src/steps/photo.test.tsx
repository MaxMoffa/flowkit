import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { render, fireEvent, waitFor } from "@testing-library/react"
import { parseFlow, type AnswerValue, type Flow, type PhotoStep } from "@flowkit-io/core"
import { PhotoStepView } from "./photo"

function photoFlow(overrides: Record<string, unknown> = {}): Flow {
  return parseFlow({
    id: "camera",
    title: "Camera",
    steps: [
      { id: "intro", type: "intro", title: "Start" },
      { id: "shot", key: "shot", type: "photo", title: "Take a photo of the receipt", ...overrides },
      { id: "review", type: "review" },
      { id: "done", type: "confirmation" },
    ],
  })
}

function StatefulPhoto({ flow }: { flow: Flow }) {
  const [value, setValue] = useState<AnswerValue>(null)
  const step = flow.steps.find((s) => s.type === "photo") as PhotoStep
  return (
    <PhotoStepView
      step={step}
      value={value}
      onChange={setValue}
      flow={flow}
      answers={value ? { shot: value } : {}}
      meta={{}}
      onMetaChange={() => {}}
    />
  )
}

function fakeStream(): MediaStream {
  return { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream
}

function pngFile(name = "photo.png"): File {
  return new File(["\x89PNG"], name, { type: "image/png" })
}

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", { value: files, configurable: true })
  fireEvent.change(input)
}

describe("PhotoStepView", () => {
  const originalMediaDevices = window.navigator.mediaDevices

  afterEach(() => {
    Object.defineProperty(window.navigator, "mediaDevices", { value: originalMediaDevices, configurable: true })
    vi.restoreAllMocks()
  })

  describe("no camera API available (falls back to the file input)", () => {
    // jsdom has no `navigator.mediaDevices` by default — every test in this repo's
    // environment already exercises the fallback path unless a test explicitly mocks
    // getUserMedia, so this group doubles as the "camera absent" case.

    it("degrades to a single camera-capture file input, never a gallery/library one", async () => {
      const { container } = render(<StatefulPhoto flow={photoFlow()} />)
      await waitFor(() => expect(container.querySelector("input[type='file']")).not.toBeNull())
      const inputs = container.querySelectorAll("input[type='file']")
      expect(inputs).toHaveLength(1)
      expect(inputs[0]?.getAttribute("capture")).toBe("environment")
      expect(inputs[0]?.getAttribute("accept")).toBe("image/*")
    })

    it("shows a status explaining the camera is unavailable", async () => {
      const { container } = render(<StatefulPhoto flow={photoFlow()} />)
      await waitFor(() => expect(container.querySelector(".fk-barcode-status")?.textContent).toMatch(/fotocamera/i))
    })

    it("captures a photo via the fallback input and shows it as a thumbnail", async () => {
      const { container } = render(<StatefulPhoto flow={photoFlow()} />)
      await waitFor(() => expect(container.querySelector("input[type='file']")).not.toBeNull())
      const input = container.querySelector("input[type='file']") as HTMLInputElement
      setInputFiles(input, [pngFile()])

      await waitFor(() => expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(1))
      expect(container.querySelector(".fk-media-thumb img")).not.toBeNull()
    })

    it("hides the capture input once maxPhotos is reached (default 1)", async () => {
      const { container } = render(<StatefulPhoto flow={photoFlow()} />)
      await waitFor(() => expect(container.querySelector("input[type='file']")).not.toBeNull())
      const input = container.querySelector("input[type='file']") as HTMLInputElement
      setInputFiles(input, [pngFile()])

      await waitFor(() => expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(1))
      expect(container.querySelector(".fk-media-actions")).toBeNull()
    })

    it("allows up to maxPhotos captures", async () => {
      const { container } = render(<StatefulPhoto flow={photoFlow({ maxPhotos: 2 })} />)
      await waitFor(() => expect(container.querySelector("input[type='file']")).not.toBeNull())
      const input = () => container.querySelector("input[type='file']") as HTMLInputElement
      setInputFiles(input(), [pngFile("a.png")])
      await waitFor(() => expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(1))
      expect(container.querySelector(".fk-media-actions")).not.toBeNull()

      setInputFiles(input(), [pngFile("b.png")])
      await waitFor(() => expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(2))
      expect(container.querySelector(".fk-media-actions")).toBeNull()
    })

    it("removes a captured photo via the grid's X button", async () => {
      const { container } = render(<StatefulPhoto flow={photoFlow()} />)
      await waitFor(() => expect(container.querySelector("input[type='file']")).not.toBeNull())
      const input = container.querySelector("input[type='file']") as HTMLInputElement
      setInputFiles(input, [pngFile()])
      await waitFor(() => expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(1))

      fireEvent.click(container.querySelector(".fk-media-remove")!)
      expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(0)
      expect(container.querySelector(".fk-media-actions")).not.toBeNull()
    })

    it("clicking a thumbnail opens the shared media viewer", async () => {
      const { container } = render(<StatefulPhoto flow={photoFlow()} />)
      await waitFor(() => expect(container.querySelector("input[type='file']")).not.toBeNull())
      const input = container.querySelector("input[type='file']") as HTMLInputElement
      setInputFiles(input, [pngFile()])
      await waitFor(() => expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(1))

      fireEvent.click(container.querySelector(".fk-media-thumb")!)
      expect(container.ownerDocument.querySelector(".fk-media-viewer")).not.toBeNull()
    })
  })

  it("shows a denied status and falls back to the file input when getUserMedia rejects with a permission error", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(Object.assign(new Error("nope"), { name: "NotAllowedError" }))
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    const { container } = render(<StatefulPhoto flow={photoFlow()} />)

    await waitFor(() => expect(container.querySelector(".fk-barcode-status")?.textContent).toMatch(/negato/i))
    await waitFor(() => expect(container.querySelector("input[type='file']")).not.toBeNull())
    expect(container.querySelector("input[capture]")).not.toBeNull()
  })

  it("opens a live viewfinder (no gallery input) when the camera stream succeeds", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream())
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    const { container } = render(<StatefulPhoto flow={photoFlow()} />)

    await waitFor(() => expect(container.querySelector(".fk-barcode-viewfinder")).not.toBeNull())
    expect(container.querySelector("input[type='file']")).toBeNull()
    await waitFor(() => expect(container.querySelector(".fk-photo-shutter")).not.toBeNull())
  })

  it("captures the current frame into the upload pipeline when the shutter is pressed", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream())
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback: BlobCallback) {
      callback(new Blob(["frame"], { type: "image/jpeg" }))
    })
    vi.spyOn(HTMLVideoElement.prototype, "clientWidth", "get").mockReturnValue(320)
    vi.spyOn(HTMLVideoElement.prototype, "clientHeight", "get").mockReturnValue(240)

    const { container } = render(<StatefulPhoto flow={photoFlow()} />)
    await waitFor(() => expect(container.querySelector(".fk-photo-shutter")).not.toBeNull())

    fireEvent.click(container.querySelector(".fk-photo-shutter")!)

    await waitFor(() => expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(1))
    // maxPhotos default 1 reached: the live camera closes (no more shutter/input shown).
    expect(container.querySelector(".fk-photo-shutter")).toBeNull()
    expect(container.querySelector("input[type='file']")).toBeNull()
  })

  it("keeps the camera stream open for another shot when under maxPhotos", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream())
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback: BlobCallback) {
      callback(new Blob(["frame"], { type: "image/jpeg" }))
    })
    vi.spyOn(HTMLVideoElement.prototype, "clientWidth", "get").mockReturnValue(320)
    vi.spyOn(HTMLVideoElement.prototype, "clientHeight", "get").mockReturnValue(240)

    const { container } = render(<StatefulPhoto flow={photoFlow({ maxPhotos: 2 })} />)
    await waitFor(() => expect(container.querySelector(".fk-photo-shutter")).not.toBeNull())

    fireEvent.click(container.querySelector(".fk-photo-shutter")!)
    await waitFor(() => expect(container.querySelectorAll(".fk-media-thumb")).toHaveLength(1))
    expect(container.querySelector(".fk-photo-shutter")).not.toBeNull()
  })

  it("stops every camera track on unmount", async () => {
    const stop = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] } as unknown as MediaStream)
    Object.defineProperty(window.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true })
    const { container, unmount } = render(<StatefulPhoto flow={photoFlow()} />)
    await waitFor(() => expect(container.querySelector(".fk-barcode-viewfinder")).not.toBeNull())

    unmount()
    expect(stop).toHaveBeenCalled()
  })
})
