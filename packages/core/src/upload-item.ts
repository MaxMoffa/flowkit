/** A single file captured/picked by a "media" or "file" step, stored as a data URL. */
export interface UploadedItem {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
  kind: "image" | "video" | "file"
}

/** Type guard: is this answer value an array of UploadedItem (media/file step shape)? */
export function isUploadedItemArray(value: unknown): value is UploadedItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) => v !== null && typeof v === "object" && typeof (v as UploadedItem).dataUrl === "string",
    )
  )
}

export type FileFormatPreset = "any" | "images" | "documents" | "pdf" | "spreadsheets" | "archives"

/** Maps a `file` step's formatPreset to an HTML input `accept` attribute value. */
export const FILE_FORMAT_PRESET_ACCEPT: Record<FileFormatPreset, string> = {
  any: "",
  images: "image/*",
  documents:
    ".doc,.docx,.txt,.rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf",
  pdf: "application/pdf,.pdf",
  spreadsheets:
    ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
  archives: ".zip,.rar,.7z,application/zip,application/x-7z-compressed,application/vnd.rar",
}

/** Combines a `file` step's formatPreset + optional customAccept into a single `accept` string. */
export function resolveFileAccept(formatPreset: FileFormatPreset, customAccept?: string): string {
  const presetAccept = FILE_FORMAT_PRESET_ACCEPT[formatPreset]
  return [presetAccept, customAccept].filter(Boolean).join(",")
}

/** Combines a `media` step's image/video toggles + optional format lists into an `accept` string. */
export function resolveMediaAccept(options: {
  acceptImages: boolean
  acceptVideos: boolean
  imageFormats?: string[]
  videoFormats?: string[]
}): string {
  const parts: string[] = []
  if (options.acceptImages) parts.push(options.imageFormats?.length ? options.imageFormats.join(",") : "image/*")
  if (options.acceptVideos) parts.push(options.videoFormats?.length ? options.videoFormats.join(",") : "video/*")
  return parts.join(",")
}
