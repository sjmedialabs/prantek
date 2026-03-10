# OTP & Email Verification Setup

## Environment variables

Add to `.env.local`:

```env
# Toggle: false = fallback (devOtp returned in API), true = send email via Resend
USE_EMAIL_SERVICE=false

# Required when USE_EMAIL_SERVICE=true
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# Used for email-verification JWT (signup after OTP)
JWT_SECRET=your-secret-key
```

- **Fallback mode** (`USE_EMAIL_SERVICE=false`): OTP is not emailed; API returns `devOtp` so the signup page can show it. Optional: OTP is also logged with `console.log("[DEV] OTP ...")`.
- **Email mode** (`USE_EMAIL_SERVICE=true`): OTP is sent via Resend. Set `RESEND_API_KEY` and `EMAIL_FROM`. OTP is never returned in the API.

## MongoDB: `otps` collection

Documents:

```json
{
  "email": "user@email.com",
  "otp": "123456",
  "expiresAt": "2026-03-09T10:10:00",
  "verified": false,
  "createdAt": "2026-03-09T10:05:00"
}
```

Optional TTL index (auto-delete expired OTPs):

```js
db.otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

## APIs

- `POST /api/auth/send-email-otp` — body: `{ email }`. Stores OTP, optionally sends email. Returns `{ success, devOtp? }` in fallback mode.
- `POST /api/auth/verify-email-otp` — body: `{ email, otp }`. Marks OTP verified, returns `{ success, token }` (JWT, 7d).
- Register accepts `verificationToken`: either this JWT (from verify-email-otp) or the legacy token from the previous flow.

## Production

Set `USE_EMAIL_SERVICE=true` and configure Resend. OTP will never be returned in the API; only real email is used.
