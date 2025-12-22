"use client"

import type { FilterValue } from "@/features/notion-filters/types/notion-filters"

type TimestampFilterEditorProps = {
  value: FilterValue
  onChange: (value: FilterValue) => void
  operator: string
  disabled?: boolean
}

export function TimestampFilterEditor({
  value,
  onChange,
  operator,
  disabled = false,
}: TimestampFilterEditorProps) {
  // For relative date operators, no input needed
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
