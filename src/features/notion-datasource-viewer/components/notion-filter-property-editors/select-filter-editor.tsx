"use client"

import * as Select from "@radix-ui/react-select"
import type { FilterValue } from "@/features/notion-datasource-viewer/types/notion-filters"

type SelectFilterEditorProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  options: Array<{ name: string }>
  disabled?: boolean
}

export function SelectFilterEditor({
  value,
  onChange,
  options,
  disabled = false,
}: SelectFilterEditorProps) {
  const selectedValue = typeof value === "string" ? value : ""

  return (
    <Select.Root
      value={selectedValue}
      onValueChange={(newValue) => onChange(newValue)}
      disabled={disabled}
    >
      <Select.Trigger className="px-2 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text text-left flex items-center justify-between min-w-0 disabled:opacity-50 disabled:cursor-not-allowed">
        <Select.Value
          placeholder="Select option"
          className="data-placeholder:text-hn-text-secondary"
        />
        <Select.Icon className="text-hn-text-secondary">▼</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="bg-white border border-hn-border shadow-none z-50">
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

