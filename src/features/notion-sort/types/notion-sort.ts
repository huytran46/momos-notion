export type NotionSort =
  | {
      property: string
      direction: "ascending" | "descending"
    }
  | {
      timestamp: "created_time" | "last_edited_time" | "last_visited_time"
      direction: "ascending" | "descending"
    }
