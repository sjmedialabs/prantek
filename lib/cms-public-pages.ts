import type {
  AboutUsPageContent,
  PublicContactPageContent,
  CmsPublicPageBlock,
  WebsiteContent,
} from "@/lib/models/types"

/** Public routes linked in the footer */
export const CMS_FOOTER_PAGE_SLUGS = ["about-us", "contact"] as const

export type CmsFooterPageSlug = (typeof CMS_FOOTER_PAGE_SLUGS)[number]

export function newCmsBlockId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function emptyCmsBlock(): CmsPublicPageBlock {
  return { id: newCmsBlockId(), heading: "", body: "", image: "", imageAlt: "" }
}

export function normalizeAboutUsPage(p?: Partial<AboutUsPageContent> | null): AboutUsPageContent {
  return {
    pageTitle: p?.pageTitle ?? "",
    heroImage: p?.heroImage ?? "",
    heroImageAlt: p?.heroImageAlt ?? "",
    heroHeading: p?.heroHeading ?? "",
    heroSubheading: p?.heroSubheading ?? "",
    blocks: Array.isArray(p?.blocks)
      ? p.blocks.map((b) => ({
          id: b.id || newCmsBlockId(),
          heading: b.heading ?? "",
          body: b.body ?? "",
          image: b.image ?? "",
          imageAlt: b.imageAlt ?? "",
        }))
      : [],
  }
}

export function normalizePublicContactPage(p?: Partial<PublicContactPageContent> | null): PublicContactPageContent {
  return {
    pageTitle: p?.pageTitle ?? "",
    heroImage: p?.heroImage ?? "",
    heroImageAlt: p?.heroImageAlt ?? "",
    introHeading: p?.introHeading ?? "",
    introBody: p?.introBody ?? "",
    blocks: Array.isArray(p?.blocks)
      ? p.blocks.map((b) => ({
          id: b.id || newCmsBlockId(),
          heading: b.heading ?? "",
          body: b.body ?? "",
          image: b.image ?? "",
          imageAlt: b.imageAlt ?? "",
        }))
      : [],
  }
}

/** Footer link label when page title is empty */
export function cmsPageLabelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""))
    .filter(Boolean)
    .join(" ")
}

export function footerNavLabel(content: WebsiteContent | null, slug: CmsFooterPageSlug): string {
  if (slug === "about-us") {
    const t = content?.aboutUsPage?.pageTitle?.trim()
    return t || cmsPageLabelFromSlug(slug)
  }
  const t = content?.publicContactPage?.pageTitle?.trim()
  return t || cmsPageLabelFromSlug(slug)
}
