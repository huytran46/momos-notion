/**
 * Parses a checkbox property from Notion API page property
 */
export function parseCheckbox(property: {
  type: "checkbox"
  checkbox: boolean
}): boolean {
  return property.checkbox
}

/**
 * Parses a date property from Notion API page property
 * Returns a formatted date string or null
 */
export function parseDate(property: {
  type: "date"
  date: { start: string; end?: string | null } | null
}): string | null {
  if (!property.date) {
    return null
  }

  if (property.date.end) {
    return `${property.date.start} - ${property.date.end}`
  }

  return property.date.start
}

/**
 * Parses a multi_select property from Notion API page property
 * Returns a comma-separated string of selected values
 */
export function parseMultiSelect(property: {
  type: "multi_select"
  multi_select: Array<{ name: string }>
}): string {
  return property.multi_select.map((item) => item.name).join(", ")
}

/**
 * Parses a number property from Notion API page property
 */
export function parseNumber(property: {
  type: "number"
  number: number | null
}): number | null {
  return property.number ?? null
}

/**
 * Parses a rich_text property from Notion API page property
 * Extracts plain text from all rich text segments
 */
export function parseRichText(property: {
  type: "rich_text"
  rich_text: Array<{ plain_text: string }>
}): string {
  return property.rich_text.map((text) => text.plain_text).join("") || ""
}

/**
 * Parses a select property from Notion API page property
 */
export function parseSelect(property: {
  type: "select"
  select: { name: string } | null
}): string | null {
  return property.select?.name ?? null
}

/**
 * Parses a timestamp property from Notion API page property
 * Timestamp can be created_time or last_edited_time
 */
export function parseTimestamp(
  property:
    | { type: "created_time"; created_time: string }
    | { type: "last_edited_time"; last_edited_time: string }
): string | null {
  if (property.type === "created_time") {
    return property.created_time
  }

  if (property.type === "last_edited_time") {
    return property.last_edited_time
  }

  return null
}

/**
 * Parses a status property from Notion API page property
 */
export function parseStatus(property: {
  type: "status"
  status: { name: string } | null
}): string | null {
  return property.status?.name ?? null
}
