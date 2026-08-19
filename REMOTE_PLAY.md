# Playing with someone on a different internet connection

Your local/Termux setup only reaches people on your own WiFi network. To let
someone anywhere in the world join, you have two options — same code, no
changes needed either way.

## Option A — Quick tunnel (fastest, temporary, no signup)

Good for: "let's hop on tonight" — gives you a public URL for as long as you
keep it running, then it's gone.

Uses **Cloudflare Tunnel**, which Cloudflare provides for free with no account
needed for this quick/temporary mode.

### Windows
1. Download `cloudflared` from: https://github.com/cloudflare/cloudflared/releases/latest
   (grab the file ending in `-windows-amd64.exe`, and rename it to
   `cloudflared.exe` for convenience — put it in the same folder as
   `server.js`).
2. Make sure your local server is already running (`node server.js`, same as
   always) in one terminal window.
3. Open a **second** terminal window in that same folder, and run:
   ```
   cloudflared.exe tunnel --url http://localhost:8080
   ```
4. It'll print a line like:
   ```
   https://random-words-here.trycloudflare.com
   ```
   That's your public link — send it to your friend, they open it in any
   browser, done.
5. Close that second terminal window when you're done playing to shut the
   tunnel down (your local server from Step 2 can keep running or also be
   stopped).

### Mac
Same idea, using Homebrew:
```
brew install cloudflared
cloudflared tunnel --url http://localhost:8080
```
(run this in a second terminal, alongside `node server.js` running in the
first, same as Windows above)

### Termux (Android)
```
pkg install cloudflared
cloudflared tunnel --url http://localhost:8080
```
(again, in a second Termux session — swipe over/open a new session tab in
Termux — while `node server.js` keeps running in the first one)

## Option B — Deploy to Render (permanent, genuinely free, no credit card)

Good for: an "always there" online version with its own stable URL, so you
don't need to keep your own computer running every time someone wants to
play. This is the "separate online version" — Render hosts it for you,
24/7, at no cost.

Heads up on the trade-off: Render's free tier puts the app to sleep after 15
minutes with no visitors, and the *first* person to open it after that waits
about 30–50 seconds while it wakes back up. Totally fine for casual play —
just give whoever's joining a heads up the first load might be slow.

### Step 1 — Put the project on GitHub (no command line needed)

1. Go to **https://github.com/signup** and make a free account if you don't
   have one already.
2. Once logged in, go to **https://github.com/new**, give it a name like
   `flippy-chat-online`, leave it **Public**, and click "Create repository."
3. On the new (empty) repo's page, click **"uploading an existing file"**.
4. From your unzipped project folder, drag in everything **except the
   `node_modules` folder** (that one's big and Render will rebuild it
   automatically) — so: `server.js`, `package.json`, `package-lock.json`,
   `README.md`, and the whole `public` folder.
5. Scroll down, click the green **"Commit changes"** button.

### Step 2 — Deploy it on Render

1. Go to **https://render.com** and sign up free (no credit card required).
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub account when prompted, and select the
   `flippy-chat-online` repo you just made.
4. Fill in:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
5. Click **"Create Web Service"**. Render will build it (takes a couple
   minutes the first time) and give you a public URL like:
   ```
   https://flippy-chat-online-xxxx.onrender.com
   ```
6. Share that link with anyone, anywhere — they just open it in a browser,
   no setup on their end at all.

### Updating it later

If you ever want to change anything, edit the files in your GitHub repo
(directly on github.com, or re-upload changed files the same way) — Render
automatically redeploys whenever the repo changes.
