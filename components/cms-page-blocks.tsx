import type { CmsPublicPageBlock } from "@/lib/models/types"

export function CmsBodyText({ text, className }: { text: string; className?: string }) {
  const paras = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paras.length === 0) return null
  return (
    <div className={className}>
      {paras.map((p, i) => (
        <p key={i} className="mb-4 last:mb-0 text-gray-600 leading-relaxed whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  )
}

export function CmsContentBlocks({ blocks }: { blocks: CmsPublicPageBlock[] }) {
  if (!blocks.length) return null
  return (
    <div className="space-y-16 py-12 max-w-6xl mx-auto px-4">
      {blocks.map((block, index) => (
        <section
          key={block.id}
          className={`flex flex-col gap-8 md:flex-row md:items-center ${
            index % 2 === 1 ? "md:flex-row-reverse" : ""
          }`}
        >
          {block.image?.trim() ? (
            <div className="md:w-1/2 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.image.trim()}
                alt={block.imageAlt?.trim() || ""}
                className="rounded-lg w-full object-cover max-h-96"
              />
            </div>
          ) : null}
          <div className={`md:w-1/2 space-y-4 ${!block.image?.trim() ? "md:w-full" : ""}`}>
            {block.heading?.trim() ? (
              <h2 className="text-2xl font-semibold text-gray-900">{block.heading.trim()}</h2>
            ) : null}
            <CmsBodyText text={block.body} />
          </div>
        </section>
      ))}
    </div>
  )
}
