const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek"
const OTP_EXPIRY_MINUTES = 5

export function getOtpEmailHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Verification code</h2>
    <p>Use this code to verify your account:</p>
    <p style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #667eea; margin: 24px 0;">${otp}</p>
    <p style="color: #666; font-size: 14px;">This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.</p>
  </div>
</body>
</html>
`.trim()
}

export function getOtpEmailText(otp: string): string {
  return `Your ${APP_NAME} verification code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
}
