import { useState } from "react"

type NotionDatasourceFormProps = {
  defaultDatasourceId?: string
  defaultNotionKey?: string
  // onSubmit: (formData: FormData) => void | Promise<void>
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}

export function NotionDatasourceForm({
  defaultDatasourceId,
  defaultNotionKey,
  onSubmit,
}: NotionDatasourceFormProps) {
  const [showNotionKey, setShowNotionKey] = useState(false)

  return (
    <form onSubmit={onSubmit} className="mb-4">
      <div className="flex items-end gap-2 flex-wrap">
        {/* Notion Key Field */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[240px]">
          <label htmlFor="notion-key" className="text-hn-text text-xs">
            Notion integration key
          </label>
          <div className="flex items-center gap-2">
            <input
              type={showNotionKey ? "text" : "password"}
              id="notion-key"
              name="notionKey"
              defaultValue={defaultNotionKey}
              required
              className="border border-hn-border bg-white px-2 py-1 text-sm text-hn-text focus:outline-none focus:border-hn-orange flex-1"
              placeholder="Enter Notion integration key"
              aria-label="Notion integration key"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowNotionKey((prev) => !prev)}
              className="text-xs text-hn-text-secondary underline cursor-pointer whitespace-nowrap"
              aria-label={
                showNotionKey
                  ? "Hide Notion integration key"
                  : "Show Notion integration key"
              }
            >
              {showNotionKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Notion Page ID Field */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-[200px]">
          <label htmlFor="datasource-id" className="text-hn-text text-xs">
            Notion datasource ID
          </label>
          <input
            type="text"
            id="datasource-id"
            name="datasourceId"
            defaultValue={defaultDatasourceId}
            required
            className="border border-hn-border bg-white px-2 py-1 text-sm text-hn-text focus:outline-none focus:border-hn-orange"
            placeholder="Enter Notion datasource ID"
            aria-label="Notion datasource ID"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-hn-orange text-white px-3 py-1 text-sm border-hn-orange cursor-pointer hover:opacity-90 whitespace-nowrap"
        >
          Submit
        </button>
      </div>
    </form>
  )
}
