import TermsManager from "./terms-manager"

export default function TermsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Quotation & Invoice Terms
      </h1>
      <TermsManager />
    </div>
  )
}
