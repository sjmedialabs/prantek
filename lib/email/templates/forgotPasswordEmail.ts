const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek"
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://mycashledger.com "

export function getForgotPasswordEmailHtml(resetToken: string, toEmail: string): string {
  const resetUrl = `${APP_URL}/reset-password?email=${encodeURIComponent(toEmail)}&token=${resetToken}`
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset Your Password</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
    <p>Hello,</p>
    <p>We received a request to reset your password for your ${APP_NAME} account. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">${resetUrl}</p>
    <p style="color: #666; font-size: 14px; margin-top: 30px;"><strong>This link will expire in 1 hour.</strong></p>
    <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">This is an automated email from ${APP_NAME}. Please do not reply.</p>
  </div>
</body>
</html>
`.trim()
}

export function getForgotPasswordEmailText(resetToken: string, toEmail: string): string {
  const resetUrl = `${APP_URL}/reset-password?email=${encodeURIComponent(toEmail)}&token=${resetToken}`
  return `Reset Your Password\n\nHello,\n\nWe received a request to reset your password for your ${APP_NAME} account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\n---\nThis is an automated email from ${APP_NAME}.`
}
