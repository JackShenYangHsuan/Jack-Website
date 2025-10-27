# Fix: "Day Story has not completed the Google verification process"

This error occurs because your Google OAuth app is in testing mode. You need to add yourself as a test user.

## Steps to Add Test Users

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials/consent

### 2. Make sure you're in the correct project
- Select "DayStory" from the project dropdown at the top

### 3. Configure OAuth Consent Screen
- Click on "OAuth consent screen" in the left sidebar
- You should see your app "DayStory" listed

### 4. Add Test Users
- Scroll down to the **"Test users"** section
- Click **"+ ADD USERS"** button
- Enter your email address (the one you want to use to sign in)
- Click **"Save"**

### 5. Verify Settings
Make sure these are set:
- **Publishing status**: Testing
- **User type**: External
- **Test users**: Your email should be listed

### 6. Try Signing In Again
- Go back to http://localhost:3000
- Click "Sign In with Google"
- It should work now!

## Important Notes

- **Testing Mode**: Your app can have up to 100 test users
- **No Verification Needed**: For personal use, you can keep it in testing mode indefinitely
- **Only Test Users**: Only emails you add as test users can sign in

## If You Want to Make It Public (Optional)

If you want anyone to be able to sign in:
1. Go to OAuth consent screen
2. Click "PUBLISH APP"
3. Google will review your app (can take days/weeks)

For personal use, just stay in testing mode and add test users as needed!
