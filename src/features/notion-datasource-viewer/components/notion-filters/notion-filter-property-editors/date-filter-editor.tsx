"use client"

import type { FilterValue } from "@/features/notion-datasource-viewer/types/notion-filters"

type DateFilterEditorProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  operator: string
  disabled?: boolean
}

export function DateFilterEditor({
  value,
  onChange,
  operator,
  disabled = false,
}: DateFilterEditorProps) {
  // For relative date operators (past_week, next_month, etc.), no input needed
  const isRelativeDate =
    operator === "past_week" ||
    operator === "past_month" ||
    operator === "past_year" ||
    operator === "next_week" ||
    operator === "next_month" ||
    operator === "next_year"

  if (isRelativeDate) {
    return (
      <div className="text-sm text-hn-text-secondary">
        {operator === "past_week" && "Past week"}
        {operator === "past_month" && "Past month"}
        {operator === "past_year" && "Past year"}
        {operator === "next_week" && "Next week"}
        {operator === "next_month" && "Next month"}
        {operator === "next_year" && "Next year"}
      </div>
    )
  }

  // For empty operators, no input needed
  if (operator === "is_empty" || operator === "is_not_empty") {
    return null
  }

  // For date range (if value is an object with start/end)
  if (typeof value === "object" && value !== null && "start" in value) {
    const dateRange = value as { start: string; end?: string | null }
    return (
      <div className="flex gap-2">
        <input
          type="date"
          value={dateRange.start || ""}
          onChange={(e) =>
            onChange({
              start: e.target.value,
              end: dateRange.end || null,
            })
          }
          disabled={disabled}
          className="px-2 py-1 text-sm border border-hn-border bg-white text-hn-text focus:outline-none focus:border-hn-orange disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {dateRange.end !== undefined && (
          <input
            type="date"
            value={dateRange.end || ""}
            onChange={(e) =>
              onChange({
                start: dateRange.start,
                end: e.target.value || null,
              })
            }
            disabled={disabled}
            className="px-2 py-1 text-sm border border-hn-border bg-white text-hn-text focus:outline-none focus:border-hn-orange disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="End date"
          />
        )}
      </div>
    )
  }

  // For single date
  const dateValue = typeof value === "string" ? value : ""

  return (
    <input
      type="date"
      value={dateValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-2 py-1 text-sm border border-hn-border bg-white text-hn-text focus:outline-none focus:border-hn-orange disabled:opacity-50 disabled:cursor-not-allowed"
    />
  )
}

