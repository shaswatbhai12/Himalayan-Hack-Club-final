# Himalayan Hack Club: login setup

Files: index.html, api/ (4 small serverless functions). Upload the whole folder to your Vercel project with index.html at the top level.

## 1. Vercel environment variables (Settings > Environment Variables)
- HC_CLIENT_SECRET = the Client Secret from auth.hackclub.com/developer/apps (regenerate it if you ever shared it)
- SESSION_SECRET   = a long random string (e.g. run: openssl rand -hex 32)
Optional: HC_CLIENT_ID, HC_REDIRECT_URI (defaults are already set in the code)

## 2. Hack Club Auth app
- Redirect URI: https://himalayan-hack-club2.vercel.app/api/hc-callback
- Scopes: openid, name, email

## 3. Clerk (lead / staff)
- Create an app at clerk.com, copy the Publishable Key (starts with pk_)
- Paste it into `config.js` as `CLERK_KEY`
- Add the Clerk Secret Key to Vercel and `.env` as `CLERK_SECRET_KEY`
- In Clerk > User & Authentication, turn OFF public sign-up and invite leads by email, so only invited people can log in
- Add your site domain under Clerk's allowed origins/domains

## 4. Clerk admin events
- Add `CLERK_SECRET_KEY` to Vercel and `.env` using the secret key from Clerk.
- Add `DATABASE_URL` to Vercel and `.env` using the Neon connection string for the events database.
- The database table is `events`; only Clerk users with an email ending in `@himalayanhackclub.xyz` can create, edit, or delete events.
- Open `/manage.html` from the Lead / staff login button. Visitors can read events on the home page but cannot change them.
- The same admin dashboard manages sponsors. Sponsor records are stored in the `sponsors` table and support a name, website, description, logo URL, accent color, and display order.

## 5. Redeploy, then test both logins from the Login dropdown.

## Run on localhost first
1. Install Node.js 18 or newer (nodejs.org).
2. In the project folder, copy `.env.example` to `.env` and fill in HC_CLIENT_SECRET and SESSION_SECRET.
3. In your Hack Club Auth app, ADD this redirect URI (keep the Vercel one too): http://localhost:3000/api/hc-callback
4. Run: node local-server.js   (or: npm start)
5. Open http://localhost:3000 and try Login > Member login.
6. For Clerk, use your pk_test_ key in index.html (works on localhost).
When you deploy to Vercel, do NOT upload .env. Set the env vars in Vercel instead, and leave HC_REDIRECT_URI unset there.

## Dashboard (Hackatime)
1. Go to https://hackatime.hackclub.com/oauth/applications and create a new application.
2. Redirect URIs (one per line): http://localhost:3000/api/ht-callback and https://himalayan-hack-club2.vercel.app/api/ht-callback
3. Scopes: profile and read. Tick "Confidential".
4. Put its Client ID and Secret into .env as HT_CLIENT_ID and HT_CLIENT_SECRET (and in Vercel env vars when you deploy).
5. Clerk key now lives in config.js (one place for both pages).
Mailing address: Hack Club only gives the address scope to official HQ programs, so the dashboard links members to auth.hackclub.com to change it.
