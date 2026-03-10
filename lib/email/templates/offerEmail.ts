const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek"
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export interface OfferEmailParams {
  recipientName?: string
  title: string
  bodyHtml: string
  ctaText?: string
  ctaUrl?: string
}

export function getOfferEmailHtml(params: OfferEmailParams): string {
  const { recipientName, title, bodyHtml, ctaText, ctaUrl } = params
  const greeting = recipientName ? `Hello ${recipientName},` : "Hello,"
  const ctaBlock =
    ctaText && ctaUrl
      ? `<div style="text-align: center; margin: 30px 0;">
      <a href="${ctaUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">${ctaText}</a>
    </div>`
      : ""
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">${title}</h2>
    <p>${greeting}</p>
    <div>${bodyHtml}</div>
    ${ctaBlock}
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">This is an automated email from ${APP_NAME}. To unsubscribe, update your preferences in account settings.</p>
  </div>
</body>
</html>
`.trim()
}

export function getOfferEmailText(params: OfferEmailParams): string {
  const { recipientName, title, bodyHtml, ctaUrl } = params
  const greeting = recipientName ? `Hello ${recipientName},` : "Hello,"
  const stripHtml = bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  const ctaLine = ctaUrl ? `\n\nVisit: ${ctaUrl}` : ""
  return `${title}\n\n${greeting}\n\n${stripHtml}${ctaLine}\n\n---\n${APP_NAME}`
}
