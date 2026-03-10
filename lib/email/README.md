# Email (Amazon SES)

All transactional email is sent via **Amazon SES**. Resend and SMTP (nodemailer) are no longer used for production email.

## Environment variables

Set these in `.env.local` (never commit real values):

```env
# AWS SES (required for sending email)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
SES_FROM_EMAIL=noreply@mycashledger.com

# App (used in reset links, dashboard links in emails)
APP_URL=http://localhost:3000
```

- **AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY**: IAM user with `ses:SendEmail`.
- **AWS_REGION**: e.g. `ap-south-1` (Mumbai).
- **SES_FROM_EMAIL**: Verified sender in SES (domain or email).
- **APP_URL**: Base URL for reset-password and dashboard links.

## Usage

- **Server-side only**: `sendEmail` and all helpers in `lib/email.ts` must be called from API routes, server components, or cron. Do not expose AWS credentials to the client.
- **Templates**: `lib/email/templates/` — otpEmail, forgotPasswordEmail, paymentReminderEmail, offerEmail, welcomeEmail.
- **Cron**: Subscription reminders (3 days and 1 day before expiry) run via `GET /api/cron/subscription-reminder` (secure with `Authorization: Bearer CRON_SECRET`).

## Production checklist

- [ ] SES domain (or email) verification completed
- [ ] DKIM enabled for the sending domain
- [ ] SES moved out of sandbox (request production access in AWS console)
