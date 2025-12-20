type NotionDatasourceFormProps = {
  defaultDatasourceId?: string
  onSubmit: (formData: FormData) => void | Promise<void>
}

export function NotionDatasourceForm({
  defaultDatasourceId,
  onSubmit,
}: NotionDatasourceFormProps) {
  return (
    <form action={onSubmit} className="mb-4">
      <div className="flex items-end gap-2 flex-wrap">
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
          className="bg-hn-orange text-white px-3 py-1 text-sm border-none cursor-pointer hover:opacity-90 whitespace-nowrap"
        >
          Submit
        </button>
      </div>
    </form>
  )
}
