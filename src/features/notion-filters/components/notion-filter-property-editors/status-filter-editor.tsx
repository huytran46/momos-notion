"use client"

import { Select } from "@/components/ui/select"
import type { FilterValue } from "@/features/notion-filters/types/notion-filters"

type StatusFilterEditorProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  options: Array<{ name: string }>
  disabled?: boolean
}

export function StatusFilterEditor({
  value,
  onChange,
  options,
  disabled = false,
}: StatusFilterEditorProps) {
  const selectedValue = typeof value === "string" ? value : ""

  return (
    <Select.Root
      value={selectedValue}
      onValueChange={(newValue) => onChange(newValue)}
      disabled={disabled}
    >
      <Select.Trigger className="inline-flex items-center justify-between">
        <Select.Value
          placeholder="Select status"
          className="flex-1 min-w-0 data-placeholder:text-hn-text-secondary"
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
