import nodemailer from "nodemailer"

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prantek"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://31.97.224.169:9080"
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@prantek.com"

/**
 * Create a nodemailer transporter
 */
function createTransporter() {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn("[EMAIL] SMTP credentials not configured. Emails will not be sent.")
    return null
  }

  return nodemailer.createTransporter(EMAIL_CONFIG)
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<boolean> {
  try {
    const transporter = createTransporter()
    
    if (!transporter) {
      console.log("[EMAIL] Skipping email send - SMTP not configured")
      console.log(`[EMAIL] Reset link would be: ${APP_URL}/reset-password?email=${encodeURIComponent(to)}&token=${resetToken}`)
      return false
    }

    const resetUrl = `${APP_URL}/reset-password?email=${encodeURIComponent(to)}&token=${resetToken}`

    const mailOptions = {
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: `Reset Your ${APP_NAME} Password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            
            <p>Hello,</p>
            
            <p>We received a request to reset your password for your ${APP_NAME} account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>This link will expire in 1 hour.</strong>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated email from ${APP_NAME}. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Reset Your Password

Hello,

We received a request to reset your password for your ${APP_NAME} account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

---
This is an automated email from ${APP_NAME}.
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("[EMAIL] Password reset email sent:", info.messageId)
    return true
  } catch (error) {
    console.error("[EMAIL] Failed to send password reset email:", error)
    return false
  }
}

/**
 * Send welcome email (optional - for future use)
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  try {
    const transporter = createTransporter()
    
    if (!transporter) {
      console.log("[EMAIL] Skipping welcome email - SMTP not configured")
      return false
    }

    const mailOptions = {
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: `Welcome to ${APP_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${name}!</h2>
            
            <p>Thank you for joining ${APP_NAME}. We're excited to have you on board!</p>
            
            <p>Get started by exploring our features and setting up your account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("[EMAIL] Welcome email sent:", info.messageId)
    return true
  } catch (error) {
    console.error("[EMAIL] Failed to send welcome email:", error)
    return false
  }
}

/**
 * Send employee login credentials
 */
export async function sendEmployeeCredentials(
  to: string,
  employeeName: string,
  tempPassword: string,
  companyName?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter()
    
    if (!transporter) {
      console.log("[EMAIL] Skipping employee credentials email - SMTP not configured")
      console.log(`[EMAIL] Employee credentials would be sent to: ${to}`)
      console.log(`[EMAIL] Temporary password: ${tempPassword}`)
      console.log(`[EMAIL] Login URL: ${APP_URL}/signin`)
      return false
    }

    const loginUrl = `${APP_URL}/signin`

    const mailOptions = {
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: `Your ${APP_NAME} Account Credentials${companyName ? ` - ${companyName}` : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Account Credentials</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to the Team, ${employeeName}!</h2>
            
            <p>Hello ${employeeName},</p>
            
            <p>An account has been created for you${companyName ? ` at <strong>${companyName}</strong>` : ''} with access to ${APP_NAME}. You can now log in to your dashboard to access the features assigned to your role.</p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #667eea; margin-top: 0;">Your Login Credentials:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${to}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Temporary Password:</td>
                  <td style="padding: 8px 0; color: #333; font-family: monospace; background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${tempPassword}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Login to Dashboard
              </a>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Important:</strong> Please change your password after logging in for the first time. Go to Profile Settings to update your password.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions or need assistance, please contact your administrator or our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated email from ${APP_NAME}. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to ${APP_NAME}!

Hello ${employeeName},

An account has been created for you${companyName ? ` at ${companyName}` : ''} with access to ${APP_NAME}.

Your Login Credentials:
Email: ${to}
Temporary Password: ${tempPassword}

Login URL: ${loginUrl}

IMPORTANT: Please change your password after logging in for the first time.
Go to Profile Settings to update your password.

If you have any questions, please contact your administrator.

---
This is an automated email from ${APP_NAME}.
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("[EMAIL] Employee credentials email sent:", info.messageId)
    return true
  } catch (error) {
    console.error("[EMAIL] Failed to send employee credentials email:", error)
    return false
  }
}
