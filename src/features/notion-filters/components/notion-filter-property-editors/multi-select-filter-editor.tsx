"use client"

import { Select } from "@/components/ui/select"
import type { FilterValue } from "@/features/notion-filters/types/notion-filters"

type MultiSelectFilterEditorProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  options: Array<{ name: string }>
  disabled?: boolean
}

export function MultiSelectFilterEditor({
  value,
  onChange,
  options,
  disabled = false,
}: MultiSelectFilterEditorProps) {
  // For multi-select, value is a string (single value for contains/does_not_contain)
  const selectedValue = typeof value === "string" ? value : ""

  return (
    <Select.Root
      value={selectedValue}
      onValueChange={(newValue) => onChange(newValue)}
      disabled={disabled}
    >
      <Select.Trigger className="inline-flex items-center justify-between">
        <Select.Value
          placeholder="Select option"
          className="flex-1 min-w-0 text-hn-text-secondary"
        />
        <Select.Icon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.ScrollUpButton />
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.name}
                value={option.name}
                className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
              >
                <Select.ItemText>{option.name}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
