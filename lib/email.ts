/**
 * Email module - powered by Amazon SES.
 * All sending goes through lib/email/sendEmail.ts (SES).
 * Templates live in lib/email/templates/.
 */

import { sendEmail, isValidEmail } from "@/lib/email/sendEmail"
import { getOtpEmailHtml, getOtpEmailText } from "@/lib/email/templates/otpEmail"
import { getAppBaseUrl } from "@/lib/email/app-base-url"
import {
  buildPasswordResetUrl,
  getForgotPasswordEmailHtml,
  getForgotPasswordEmailText,
} from "@/lib/email/templates/forgotPasswordEmail"
import { getWelcomeEmailHtml, getWelcomeEmailText } from "@/lib/email/templates/welcomeEmail"
import {
  getPaymentReminderEmailHtml,
  getPaymentReminderEmailText,
  type PaymentReminderParams,
} from "@/lib/email/templates/paymentReminderEmail"
import {
  getOfferEmailHtml,
  getOfferEmailText,
  type OfferEmailParams,
} from "@/lib/email/templates/offerEmail"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek"

export { isValidEmail }

/**
 * Send password reset email via SES
 */
export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  if (!isValidEmail(to)) {
    console.error("[EMAIL] Invalid email for password reset:", to)
    return false
  }
  const resetUrl = buildPasswordResetUrl(to, resetToken)
  console.log("[EMAIL] Reset URL:", resetUrl)

  const result = await sendEmail({
    to,
    subject: `Reset Your ${APP_NAME} Password`,
    html: getForgotPasswordEmailHtml(resetToken, to),
    text: getForgotPasswordEmailText(resetToken, to),
  })
  return result.success
}

/**
 * Send welcome email via SES
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  if (!isValidEmail(to)) return false
  const result = await sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}!`,
    html: getWelcomeEmailHtml(name),
    text: getWelcomeEmailText(name),
  })
  return result.success
}

/**
 * Send signup OTP email (6-digit code). OTP expires in 5 minutes.
 * Returns { sent: true } or { sent: false, reason: string }.
 */
export async function sendSignupOtpEmail(
  to: string,
  otp: string
): Promise<{ sent: true } | { sent: false; reason: string }> {
  if (!isValidEmail(to)) {
    return { sent: false, reason: "Invalid email address." }
  }
  const result = await sendEmail({
    to,
    subject: `Your ${APP_NAME} verification code`,
    html: getOtpEmailHtml(otp),
    text: getOtpEmailText(otp),
  })
  if (result.success) return { sent: true }
  return { sent: false, reason: result.error || "Failed to send email." }
}

/**
 * Send payment/subscription reminder email via SES
 */
export async function sendPaymentReminderEmail(to: string, params: PaymentReminderParams): Promise<boolean> {
  if (!isValidEmail(to)) return false
  const result = await sendEmail({
    to,
    subject: `Your ${APP_NAME} subscription expires in ${params.daysUntilExpiry} day(s)`,
    html: getPaymentReminderEmailHtml(params),
    text: getPaymentReminderEmailText(params),
  })
  return result.success
}

/**
 * Send promotional/offer email via SES
 */
export async function sendOfferEmail(to: string, params: OfferEmailParams & { subject?: string }): Promise<boolean> {
  if (!isValidEmail(to)) return false
  const subject = params.subject || params.title
  const result = await sendEmail({
    to,
    subject,
    html: getOfferEmailHtml(params),
    text: getOfferEmailText(params),
  })
  return result.success
}

/**
 * Send employee login credentials via SES
 */
export async function sendEmployeeCredentials(
  to: string,
  employeeName: string,
  tempPassword: string,
  companyName?: string
): Promise<boolean> {
  if (!isValidEmail(to)) return false
  const loginUrl = `${getAppBaseUrl()}/signin`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Welcome to the Team, ${employeeName}!</h2>
    <p>Hello ${employeeName},</p>
    <p>An account has been created for you${companyName ? ` at <strong>${companyName}</strong>` : ""} with access to ${APP_NAME}.</p>
    <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #667eea; margin-top: 0;">Your Login Credentials:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0;">${to}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Temporary Password:</td><td style="padding: 8px 0; font-family: monospace; background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Login to Dashboard</a>
    </div>
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #856404;"><strong>⚠️ Important:</strong> Please change your password after first login (Profile Settings).</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">This is an automated email from ${APP_NAME}.</p>
  </div>
</body>
</html>
  `.trim()
  const text = `Welcome to ${APP_NAME}!\n\nHello ${employeeName},\n\nYour login: ${to}\nTemporary password: ${tempPassword}\nLogin URL: ${loginUrl}\n\nPlease change your password after first login.\n\n---\n${APP_NAME}`
  const result = await sendEmail({
    to,
    subject: `Your ${APP_NAME} Account Credentials${companyName ? ` - ${companyName}` : ""}`,
    html,
    text,
  })
  return result.success
}
