"use client"

import type { FilterValue } from "@/features/notion-filters/types/notion-filters"

type NumberFilterEditorProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  disabled?: boolean
}

export function NumberFilterEditor({
  value,
  onChange,
  disabled = false,
}: NumberFilterEditorProps) {
  const numberValue =
    typeof value === "number"
      ? value
      : value === null
        ? ""
        : Number(value) || ""

  return (
    <input
      type="number"
      value={numberValue}
      onChange={(e) => {
        const numValue = e.target.value === "" ? null : Number(e.target.value)
        onChange(numValue === null || Number.isNaN(numValue) ? null : numValue)
      }}
      disabled={disabled}
      className="px-2 py-1 text-sm border border-hn-border bg-white text-hn-text focus:outline-none focus:border-hn-orange disabled:opacity-50 disabled:cursor-not-allowed"
      placeholder="Enter number"
    />
  )
}
