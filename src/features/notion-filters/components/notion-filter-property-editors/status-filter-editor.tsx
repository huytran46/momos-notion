"use client"

import * as Select from "@radix-ui/react-select"
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
      <Select.Trigger className="px-2 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text text-left inline-flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed">
        <Select.Value
          placeholder="Select status"
          className="flex-1 min-w-0 data-placeholder:text-hn-text-secondary"
        />
        <Select.Icon className="text-hn-text-secondary shrink-0">▼</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="bg-white border border-hn-border shadow-none">
          <Select.ScrollUpButton className="hidden" />
          <Select.Viewport className="p-1">
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
          <Select.ScrollDownButton className="hidden" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
