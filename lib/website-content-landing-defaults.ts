import type { WebsiteContent, LandingNavLink } from "@/lib/models/types"

/**
 * Default landing chrome for documents missing these keys (older DB rows).
 * Public site should not hardcode copy; these defaults are merged in GET /api/website-content.
 */
export const WEBSITE_CONTENT_LANDING_DEFAULTS: Partial<WebsiteContent> = {
  landingNavLinks: [
    { label: "Features", href: "/#features" },
    { label: "Industries", href: "/#industries" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Help Center", href: "/help-center" },
    { label: "Contact Us", href: "/contact" },
    { label: "Customer Stories", href: "/#testimonials" },
    { label: "FAQ", href: "/#faq" },
  ],
  landingHeaderSignInLabel: "Sign In",
  landingHeaderCtaLabel: "Get Started",

  heroWatchDemoLabel: "Watch Demo",
  heroTrialBullet1: "{trialDays}-day free trial",
  heroTrialBullet2: "Cancel anytime",
  heroSecureBadgeText: "✓ Secure",
  heroRightImageAlt: "",

  featuresSectionBadge: "Features",
  industriesSectionBadge: "Industries",
  industriesCardCtaText: "Explore solutions",

  showcaseCardTitle: "Dashboard",
  showcaseCardBadge: "Live Data",
  showcaseCardStats: [
    { label: "Total Revenue", value: "₹24,56,800" },
    { label: "Active Clients", value: "1,247" },
    { label: "Assets Tracked", value: "3,456" },
  ],
  showcaseFinanceTitle: "Financial Overview",
  showcaseFinanceRows: [
    { label: "Accounts Receivable", value: "₹45,230", trend: "+12%" },
    { label: "Accounts Payable", value: "₹23,450", trend: "-5%" },
    { label: "Cash Flow", value: "₹21,780", trend: "+8%" },
  ],
  showcaseActivityTitle: "Recent Activity",
  showcaseActivityLines: [
    "New client onboarded - TechCorp Inc.",
    "Asset #A-1234 assigned to John Doe",
    "Invoice #INV-5678 approved",
  ],

  faqSectionBadge: "Support",

  pricingMonthlyLabel: "Monthly",
  pricingYearlyLabel: "Yearly",
  pricingYearlySaveTemplate: "Save {yearlyDiscount}%",
  pricingPlanTrialBadgeTemplate: "{trialDays}-Day Free Trial",
  pricingPopularRibbonText: "MOST POPULAR",
  pricingPopularPlanName: "Premium",
  pricingEnterprisePlanName: "Enterprise",
  pricingEnterpriseDisplayPrice: "Custom",
  pricingEnterpriseDisplaySubtext: "Tailored pricing",
  pricingContactSalesLabel: "Contact Sales",
  pricingGetStartedLabel: "Get Started Now",
  pricingPerMonthLabel: "per month",
  pricingPerYearLabel: "per year",

  videosPageSidebarTitle: "Help Center",
  videosPageBrowseMobileLabel: "Browse help topics",
  videosPageMoreHeading: "More in this section",
  videosPageEmptySelect: "Select a category from the left.",
  videosPageAllInCategoryTemplate: "All videos – {name}",
  videosPageLoadingLabel: "Loading…",
  videosPageNoVideosLabel: "No videos yet.",
  videosPageNoOtherInTabLabel: "No other videos in this tab.",
}

/** Normalize legacy /videos links, dedupe, ensure Help Center + Contact Us in nav. */
export function sanitizeLandingNavLinks(links: unknown): LandingNavLink[] {
  if (!Array.isArray(links)) return [...(WEBSITE_CONTENT_LANDING_DEFAULTS.landingNavLinks as LandingNavLink[])]

  const normalized: LandingNavLink[] = links
    .map((raw) => {
      const r = raw as { label?: string; href?: string }
      let href = (r.href || "").trim()
      let label = (r.label || "").trim()
      const lower = href.toLowerCase()
      if (href === "/videos" || lower.endsWith("/videos")) {
        href = "/help-center"
        if (!label || label === "Videos") label = "Help Center"
      }
      return { label, href }
    })
    .filter((l) => l.label && l.href)

  const seen = new Set<string>()
  const deduped: LandingNavLink[] = []
  for (const l of normalized) {
    const h = l.href
    if (seen.has(h)) continue
    seen.add(h)
    deduped.push(l)
  }

  if (!seen.has("/help-center")) {
    deduped.push({ label: "Help Center", href: "/help-center" })
    seen.add("/help-center")
  }
  if (!seen.has("/contact")) {
    deduped.push({ label: "Contact Us", href: "/contact" })
  }

  return deduped
}

export function applyLandingContentDefaults<T extends Record<string, unknown>>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>
  for (const [key, val] of Object.entries(WEBSITE_CONTENT_LANDING_DEFAULTS)) {
    if (out[key] === undefined) {
      out[key] = val as never
    }
  }
  out.landingNavLinks = sanitizeLandingNavLinks(out.landingNavLinks) as never
  return out as T
}
