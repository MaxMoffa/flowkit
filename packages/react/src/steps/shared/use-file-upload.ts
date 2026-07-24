import type { AnswerValue, UploadedItem } from "@flowkit-io/core"

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export interface FileUploadOptions {
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  maxItems?: number
  /** How to classify a picked file: the media step splits image/video, the file step doesn't. */
  kindOf: (file: File) => UploadedItem["kind"]
}

export interface FileUpload {
  items: UploadedItem[]
  /** How many more files fit, or undefined when there is no limit. */
  remaining: number | undefined
  canAddMore: boolean
  addFiles: (files: FileList | null) => Promise<void>
  removeItem: (id: string) => void
}

/**
 * Reading picked files into UploadedItem values, shared by the media and file steps.
 *
 * The double casts are the ones both steps already performed: AnswerValue does not
 * structurally include UploadedItem[], so the boundary needs them until that type widens.
 */
export function useFileUpload({ value, onChange, maxItems, kindOf }: FileUploadOptions): FileUpload {
  const items: UploadedItem[] = Array.isArray(value) ? (value as unknown as UploadedItem[]) : []
  const remaining = maxItems !== undefined ? Math.max(0, maxItems - items.length) : undefined
  const canAddMore = remaining === undefined || remaining > 0

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const list = remaining !== undefined ? Array.from(files).slice(0, remaining) : Array.from(files)
    const newItems = await Promise.all(
      list.map(async (file) => ({
        id: makeId(),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: await readAsDataUrl(file),
        kind: kindOf(file),
      })),
    )
    onChange([...items, ...newItems] as unknown as AnswerValue)
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id) as unknown as AnswerValue)
  }

  return { items, remaining, canAddMore, addFiles, removeItem }
}
