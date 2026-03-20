/**
 * Replace `{trialDays}`, `{yearlyDiscount}` etc. in CMS strings from admin.
 */
export function formatLandingText(
  template: string | undefined | null,
  vars: Record<string, string | number | undefined>,
): string {
  if (template == null || template === "") return ""
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key]
    return v !== undefined && v !== null ? String(v) : ""
  })
}
