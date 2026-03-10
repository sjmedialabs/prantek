const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek"
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export function getWelcomeEmailHtml(name: string): string {
  const dashboardUrl = `${APP_URL}/dashboard`
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Welcome, ${name}!</h2>
    <p>Thank you for joining ${APP_NAME}. We're excited to have you on board!</p>
    <p>Get started by exploring our features and setting up your account.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Go to Dashboard</a>
    </div>
    <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
  </div>
</body>
</html>
`.trim()
}

export function getWelcomeEmailText(name: string): string {
  const dashboardUrl = `${APP_URL}/dashboard`
  return `Welcome to ${APP_NAME}!\n\nHello ${name},\n\nThank you for joining. Get started here: ${dashboardUrl}\n\n---\n${APP_NAME}`
}
