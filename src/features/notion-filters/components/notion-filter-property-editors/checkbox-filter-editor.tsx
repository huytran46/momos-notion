"use client"

import * as Checkbox from "@radix-ui/react-checkbox"
import type { FilterValue } from "@/features/notion-filters/types/notion-filters"

type CheckboxFilterEditorProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  disabled?: boolean
}

export function CheckboxFilterEditor({
  value,
  onChange,
  disabled = false,
}: CheckboxFilterEditorProps) {
  const checked = value === true

  return (
    <div className="flex items-center gap-2">
      <Checkbox.Root
        checked={checked}
        onCheckedChange={(checked) => {
          onChange(checked === true)
        }}
        disabled={disabled}
        className="flex h-4 w-4 items-center justify-center border border-hn-border bg-white data-[state=checked]:bg-hn-orange data-[state=checked]:border-hn-orange"
      >
        <Checkbox.Indicator className="text-white">✓</Checkbox.Indicator>
      </Checkbox.Root>
      <span className="text-sm text-hn-text">
        {checked ? "Checked" : "Unchecked"}
      </span>
    </div>
  )
}
