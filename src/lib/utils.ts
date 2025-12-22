type ClassValue = string | undefined | null | boolean | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter(Boolean)
    .map((input) => {
      if (typeof input === "string") return input
      if (Array.isArray(input)) return cn(...input)
      return ""
    })
    .filter(Boolean)
    .join(" ")
}
