import type { ReactNode } from "react"

/** Shared "page with a folded corner" base for the file-type icon set below — each
 *  icon differs only in the mark drawn inside it. Replaces the per-mimetype emoji
 *  returned by `fileIcon()` in file.tsx. */
function FileTypeBase({ children }: { children?: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3.6h6.4L17 7.2v12.2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1Z" />
      <path d="M13.4 3.6V6.6a.6.6 0 0 0 .6.6h3" />
      {children}
    </svg>
  )
}

export function FileImageIcon() {
  return (
    <FileTypeBase>
      <circle cx="9.2" cy="10.6" r="0.9" fill="currentColor" stroke="none" />
      <path d="M6.6 15.6l2.4-2.6 1.8 1.8 2.4-2.8 3 3.4" />
    </FileTypeBase>
  )
}

export function FilePdfIcon() {
  return (
    <FileTypeBase>
      <path d="M8.4 16.2v4.2l1.6-1.2 1.6 1.2v-4.2" />
    </FileTypeBase>
  )
}

export function FileWordIcon() {
  return (
    <FileTypeBase>
      <path d="M7.8 10.4h6.4M7.8 13h6.4M7.8 15.6h4.2" />
    </FileTypeBase>
  )
}

export function FileSpreadsheetIcon() {
  return (
    <FileTypeBase>
      <path d="M7.6 11h7v7h-7Z" />
      <path d="M11.1 11v7M7.6 14.5h7" />
    </FileTypeBase>
  )
}

export function FileArchiveIcon() {
  return (
    <FileTypeBase>
      <path d="M11 4.2v2M13 6.2v2M11 8.2v2M13 10.2v2M11 12.2v2M13 14.2v2" />
    </FileTypeBase>
  )
}

export function FileGenericIcon() {
  return <FileTypeBase />
}
