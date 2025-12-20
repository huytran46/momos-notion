import type {
  DataSourceObjectResponse,
  PageObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints"
import type { ColumnDef } from "@tanstack/react-table"

/**
 * Parses a checkbox property from Notion API page property
 */
function parseCheckbox(property: {
  type: "checkbox"
  checkbox: boolean
}): boolean {
  return property.checkbox
}

/**
 * Parses a date property from Notion API page property
 * Returns a formatted date string or null
 */
function parseDate(property: {
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
function parseMultiSelect(property: {
  type: "multi_select"
  multi_select: Array<{ name: string }>
}): string {
  return property.multi_select.map((item) => item.name).join(", ")
}

/**
 * Parses a number property from Notion API page property
 */
function parseNumber(property: {
  type: "number"
  number: number | null
}): number | null {
  return property.number ?? null
}

/**
 * Parses a rich_text property from Notion API page property
 * Extracts plain text from all rich text segments
 */
function parseRichText(property: {
  type: "rich_text"
  rich_text: Array<{ plain_text: string }>
}): string {
  return property.rich_text.map((text) => text.plain_text).join("") || ""
}

/**
 * Parses a select property from Notion API page property
 */
function parseSelect(property: {
  type: "select"
  select: { name: string } | null
}): string | null {
  return property.select?.name ?? null
}

/**
 * Parses a timestamp property from Notion API page property
 * Timestamp can be created_time, last_edited_time, or last_visited_time
 */
function parseTimestamp(
  property:
    | { type: "created_time"; created_time: string }
    | { type: "last_edited_time"; last_edited_time: string }
    | { type: "last_visited_time"; last_visited_time: string }
): string | null {
  if (property.type === "created_time") {
    return property.created_time
  }

  if (property.type === "last_edited_time") {
    return property.last_edited_time
  }

  if (property.type === "last_visited_time") {
    return property.last_visited_time
  }

  return null
}

/**
 * Parses a status property from Notion API page property
 */
function parseStatus(property: {
  type: "status"
  status: { name: string } | null
}): string | null {
  return property.status?.name ?? null
}

/**
 * Parses a created_by property from Notion API page property
 * Returns user name or ID if name is null
 */
function parseCreatedBy(property: {
  type: "created_by"
  created_by: { id: string; object: "user"; name: string | null }
}): string | null {
  return property.created_by?.name ?? property.created_by?.id ?? null
}

/**
 * Parses an email property from Notion API page property
 */
function parseEmail(property: {
  type: "email"
  email: string | null
}): string | null {
  return property.email
}

/**
 * Parses a files property from Notion API page property
 * Returns comma-separated list of file names or URLs
 */
function parseFiles(property: {
  type: "files"
  files: Array<{
    name: string
    file?: { url: string }
    external?: { url: string }
  }>
}): string {
  return property.files
    .map((file) => file.name || file.file?.url || file.external?.url || "")
    .filter(Boolean)
    .join(", ")
}

/**
 * Parses a formula property from Notion API page property
 * Handles string, date, number, and boolean formula results
 */
function parseFormula(property: {
  type: "formula"
  formula:
    | { type: "string"; string: string | null }
    | { type: "date"; date: { start: string; end?: string | null } | null }
    | { type: "number"; number: number | null }
    | { type: "boolean"; boolean: boolean | null }
}): string | number | boolean | null {
  const formula = property.formula

  if (formula.type === "string") {
    return formula.string
  }

  if (formula.type === "date") {
    if (!formula.date) {
      return null
    }
    if (formula.date.end) {
      return `${formula.date.start} - ${formula.date.end}`
    }
    return formula.date.start
  }

  if (formula.type === "number") {
    return formula.number
  }

  if (formula.type === "boolean") {
    return formula.boolean
  }

  return null
}

/**
 * Parses a last_edited_by property from Notion API page property
 * Returns user name or ID if name is null
 */
function parseLastEditedBy(property: {
  type: "last_edited_by"
  last_edited_by: { id: string; object: "user"; name: string | null }
}): string | null {
  return property.last_edited_by?.name ?? property.last_edited_by?.id ?? null
}

/**
 * Parses a people property from Notion API page property
 * Returns comma-separated list of user/group names
 */
function parsePeople(property: {
  type: "people"
  people: Array<
    | { id: string; object: "user"; name: string | null }
    | { id: string; object: "group"; name: string | null }
  >
}): string {
  return property.people
    .map((person) => person.name ?? person.id)
    .filter(Boolean)
    .join(", ")
}

/**
 * Parses a phone_number property from Notion API page property
 */
function parsePhoneNumber(property: {
  type: "phone_number"
  phone_number: string | null
}): string | null {
  return property.phone_number
}

/**
 * Parses a place property from Notion API page property
 * Returns formatted string with name/address or coordinates
 */
function parsePlace(property: {
  type: "place"
  place: {
    lat: number
    lon: number
    name?: string | null
    address?: string | null
  } | null
}): string | null {
  if (!property.place) {
    return null
  }

  const { name, address, lat, lon } = property.place

  if (name) {
    return address ? `${name} (${address})` : `${name} (${lat}, ${lon})`
  }

  if (address) {
    return address
  }

  return `${lat}, ${lon}`
}

/**
 * Parses a relation property from Notion API page property
 * Returns comma-separated list of relation IDs
 */
function parseRelation(property: {
  type: "relation"
  relation: Array<{ id: string }>
}): string {
  return property.relation.map((rel) => rel.id).join(", ")
}

/**
 * Parses a rollup property from Notion API page property
 * Handles number, date, and array-based rollup results
 */
function parseRollup(property: {
  type: "rollup"
  rollup:
    | { type: "number"; number: number | null; function: string }
    | {
        type: "date"
        date: { start: string; end?: string | null } | null
        function: string
      }
    | { type: "array"; array: Array<unknown>; function: string }
}): string | number | null {
  const rollup = property.rollup

  if (rollup.type === "number") {
    return rollup.number
  }

  if (rollup.type === "date") {
    if (!rollup.date) {
      return null
    }
    if (rollup.date.end) {
      return `${rollup.date.start} - ${rollup.date.end}`
    }
    return rollup.date.start
  }

  if (rollup.type === "array") {
    // For array-based rollups, return a count or formatted string
    const count = rollup.array.length
    return count > 0 ? `${count} item${count !== 1 ? "s" : ""}` : ""
  }

  return null
}

/**
 * Parses a title property from Notion API page property
 * Extracts plain text from all rich text segments (similar to rich_text)
 */
function parseTitle(property: {
  type: "title"
  title: Array<{ plain_text: string }>
}): string {
  return property.title.map((text) => text.plain_text).join("") || ""
}

/**
 * Parses a url property from Notion API page property
 */
function parseUrl(property: {
  type: "url"
  url: string | null
}): string | null {
  return property.url
}

/**
 * Parses a unique_id property from Notion API page property
 * Returns formatted string like "TASK-123" or just the number if no prefix
 */
function parseUniqueId(property: {
  type: "unique_id"
  unique_id: { prefix: string | null; number: number | null }
}): string | null {
  const { prefix, number } = property.unique_id

  if (number === null) {
    return null
  }

  if (prefix) {
    return `${prefix}-${number}`
  }

  return String(number)
}

/**
 * Parses a single property from a Notion page property to primitives
 * Routes to the appropriate parser based on property type
 */
function notionPropertyToPrimitives(
  property: unknown
): string | number | boolean | null {
  if (!property || typeof property !== "object") {
    return null
  }

  const prop = property as { type: string; [key: string]: unknown }

  switch (prop.type) {
    case "checkbox":
      return parseCheckbox(prop as { type: "checkbox"; checkbox: boolean })

    case "created_by":
      return parseCreatedBy(
        prop as {
          type: "created_by"
          created_by: { id: string; object: "user"; name: string | null }
        }
      )

    case "created_time":
    case "last_edited_time":
    case "last_visited_time":
      return parseTimestamp(
        prop as
          | { type: "created_time"; created_time: string }
          | { type: "last_edited_time"; last_edited_time: string }
          | { type: "last_visited_time"; last_visited_time: string }
      )

    case "date":
      return parseDate(
        prop as {
          type: "date"
          date: { start: string; end?: string | null } | null
        }
      )

    case "email":
      return parseEmail(prop as { type: "email"; email: string | null })

    case "files":
      return parseFiles(
        prop as {
          type: "files"
          files: Array<{
            name: string
            file?: { url: string }
            external?: { url: string }
          }>
        }
      )

    case "formula":
      return parseFormula(
        prop as {
          type: "formula"
          formula:
            | { type: "string"; string: string | null }
            | {
                type: "date"
                date: { start: string; end?: string | null } | null
              }
            | { type: "number"; number: number | null }
            | { type: "boolean"; boolean: boolean | null }
        }
      )

    case "last_edited_by":
      return parseLastEditedBy(
        prop as {
          type: "last_edited_by"
          last_edited_by: { id: string; object: "user"; name: string | null }
        }
      )

    case "multi_select":
      return parseMultiSelect(
        prop as {
          type: "multi_select"
          multi_select: Array<{ name: string }>
        }
      )

    case "number":
      return parseNumber(prop as { type: "number"; number: number | null })

    case "people":
      return parsePeople(
        prop as {
          type: "people"
          people: Array<
            | { id: string; object: "user"; name: string | null }
            | { id: string; object: "group"; name: string | null }
          >
        }
      )

    case "phone_number":
      return parsePhoneNumber(
        prop as { type: "phone_number"; phone_number: string | null }
      )

    case "place":
      return parsePlace(
        prop as {
          type: "place"
          place: {
            lat: number
            lon: number
            name?: string | null
            address?: string | null
          } | null
        }
      )

    case "relation":
      return parseRelation(
        prop as { type: "relation"; relation: Array<{ id: string }> }
      )

    case "rich_text":
      return parseRichText(
        prop as {
          type: "rich_text"
          rich_text: Array<{ plain_text: string }>
        }
      )

    case "rollup":
      return parseRollup(
        prop as {
          type: "rollup"
          rollup:
            | { type: "number"; number: number | null; function: string }
            | {
                type: "date"
                date: { start: string; end?: string | null } | null
                function: string
              }
            | { type: "array"; array: Array<unknown>; function: string }
        }
      )

    case "select":
      return parseSelect(
        prop as { type: "select"; select: { name: string } | null }
      )

    case "status":
      return parseStatus(
        prop as { type: "status"; status: { name: string } | null }
      )

    case "title":
      return parseTitle(
        prop as { type: "title"; title: Array<{ plain_text: string }> }
      )
    case "url":
      return parseUrl(prop as { type: "url"; url: string | null })

    case "unique_id":
      return parseUniqueId(
        prop as {
          type: "unique_id"
          unique_id: { prefix: string | null; number: number | null }
        }
      )

    default:
      // Return a string indicating unhandled property type for debugging
      return `[UNHANDLED: ${prop.type}]`
  }
}

/**
 * Generates column definitions from a Notion data source schema
 * @param properties - Data source properties from dataSources.retrieve()
 * @returns Array of column definitions for TanStack Table
 */
export function notionPropsToColumnDefs(
  properties: DataSourceObjectResponse["properties"]
): ColumnDef<Record<string, unknown>>[] {
  return Object.entries(properties).map(([key, property]) => ({
    accessorKey: key,
    header: property.name,
  }))
}

/**
 * Parses Notion page results into flat data objects
 * @param results - Array of page results from dataSources.query()
 * @returns Array of parsed data objects
 */
export function notionPageResultsToRowData(
  results: Array<PageObjectResponse | PartialPageObjectResponse>
): Record<string, unknown>[] {
  return results.map((page) => {
    const rowData: Record<string, unknown> = {}

    // Only process PageObjectResponse (full pages), skip partial responses
    if (page.object === "page" && "properties" in page) {
      Object.entries(page.properties).forEach(([key, property]) => {
        const value = notionPropertyToPrimitives(property)
        rowData[key] = value
      })
    }

    return rowData
  })
}
