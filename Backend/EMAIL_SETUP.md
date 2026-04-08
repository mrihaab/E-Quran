# Email Setup Guide for E-Quran Backend

## Quick Setup (Gmail)

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Click on "2-Step Verification" and enable it
3. Follow Google's instructions

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** from the first dropdown
3. Select **Windows Computer** from the second dropdown
4. Click "Generate"
5. Google will show you a 16-character password
6. **Copy the entire password** (without spaces)

### Step 3: Update .env File
Open `Backend/.env` and update:

```
SMTP_USER=your-email@gmail.com
SMTP_PASS=paste-your-16-character-password-here
ADMIN_EMAIL=your-email@gmail.com
```

### Step 4: Restart Backend
```powershell
cd Backend
npm run dev
```

You should see: `✓ Email credentials verified and ready to send`

## Testing the Email

1. Go to Contact page on your app
2. Fill out the form with:
   - Name: Your Name
   - Email: Your Gmail
   - Subject: Test Message
   - Message: This is a test

3. Click "Send Message"
4. Check your Gmail inbox in a few seconds

## Important Security Notes

⚠️ **DO NOT:**
- Use your regular Gmail password (use the App Password)
- Push `.env` file to GitHub
- Share your App Password

✓ **DO:**
- Use the 16-character App Password from Google
- Keep `.env` file private
- Regenerate the App Password if compromised

## Troubleshooting

### "Invalid credentials" error
- Check you're using the correct Gmail address
- Verify the 16-character App Password was copied correctly (no extra spaces)
- Make sure 2-Factor Authentication is enabled

### "Connection timeout"
- Check your internet connection
- Make sure port 587 is not blocked

### Email not arriving in Gmail
- Check Spam/Promotions folder
- Wait 10 seconds before checking
- Check the backend logs for errors

## Environment Variables Reference

| Variable | Example | Required |
|----------|---------|----------|
| SMTP_USER | your-email@gmail.com | Yes (for Gmail) |
| SMTP_PASS | 16-char-app-password | Yes (for Gmail) |
| ADMIN_EMAIL | your-email@gmail.com | Yes |
| PORT | 5000 | No (default: 5000) |
| SMTP_HOST | smtp.gmail.com | No (auto for Gmail) |
| SMTP_PORT | 587 | No (auto for Gmail) |
