/** Instant shell while super-admin route segment loads (reduces perceived blank screen). */
export default function SuperAdminLoading() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 px-4">
      <div
        className="h-9 w-9 rounded-full border-2 border-gray-200 border-t-purple-600 animate-spin"
        aria-hidden
      />
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  )
}
