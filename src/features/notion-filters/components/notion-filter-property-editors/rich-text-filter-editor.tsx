"use client"

import type { FilterValue } from "@/features/notion-filters/types/notion-filters"

type RichTextFilterEditorProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  disabled?: boolean
}

export function RichTextFilterEditor({
  value,
  onChange,
  disabled = false,
}: RichTextFilterEditorProps) {
  const textValue = typeof value === "string" ? value : ""

  return (
    <input
      type="text"
      value={textValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-2 py-1 text-sm border border-hn-border bg-white text-hn-text focus:outline-none focus:border-hn-orange disabled:opacity-50 disabled:cursor-not-allowed w-full"
      placeholder="Enter text"
    />
  )
}
