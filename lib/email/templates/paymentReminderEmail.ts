import { getAppBaseUrl } from "@/lib/email/app-base-url"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek"

export interface PaymentReminderParams {
  recipientName: string
  planName: string
  expiryDate: string
  daysUntilExpiry: number
}

export function getPaymentReminderEmailHtml(params: PaymentReminderParams): string {
  const { recipientName, planName, expiryDate, daysUntilExpiry } = params
  const dashboardUrl = `${getAppBaseUrl("https://mycashledger.com")}/dashboard/plans`
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Subscription reminder</h2>
    <p>Hello ${recipientName},</p>
    <p>Your <strong>${planName}</strong> subscription will expire in <strong>${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}</strong> (${expiryDate}).</p>
    <p>To avoid any interruption, please renew your subscription before the expiry date.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Renew subscription</a>
    </div>
    <p style="color: #666; font-size: 14px;">If you have already renewed, you can ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">This is an automated email from ${APP_NAME}.</p>
  </div>
</body>
</html>
`.trim()
}

export function getPaymentReminderEmailText(params: PaymentReminderParams): string {
  const { recipientName, planName, expiryDate, daysUntilExpiry } = params
  const dashboardUrl = `${getAppBaseUrl("https://mycashledger.com")}/dashboard/plans`
  return `Hello ${recipientName},\n\nYour ${planName} subscription will expire in ${daysUntilExpiry} day(s) (${expiryDate}).\n\nRenew here: ${dashboardUrl}\n\n---\n${APP_NAME}`
}
