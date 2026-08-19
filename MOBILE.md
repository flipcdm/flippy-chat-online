# Running on Android

## Option A — phone as a "second player" (easiest, zero setup)

Keep the server running on your PC exactly as in the main README, then on
your Android phone (connected to the **same WiFi network** as the PC):

1. Open Chrome (or any browser) on the phone.
2. Go to `http://<your PC's LAN IP>:8080` — same address described in
   "Step 7 — Chatting with someone else" in `README.md`.
3. Tap to walk, just like clicking on desktop — Ruffle (the Flash emulator
   this uses) translates touch taps into clicks automatically, so the
   point-and-click movement works with your finger.

This is the option to use if you just want to hop in from your phone while
your computer does the work.

## Option B — run the whole server on the phone itself (no PC needed at all)

This uses **Termux**, a free terminal app that lets Android run real Linux
command-line tools, including Node.js.

### Step 1 — Install Termux

Get it from **F-Droid** (recommended — the Play Store version is outdated
and no longer maintained): https://f-droid.org/en/packages/com.termux/

(You'll need to install the F-Droid app first if you don't have it —
https://f-droid.org — then search "Termux" inside it and install.)

### Step 2 — Set up Termux (one-time)

Open Termux and type each of these, pressing Enter after each, waiting for
each to finish before typing the next:

```
pkg update && pkg upgrade
pkg install nodejs unzip
termux-setup-storage
```

That last command will pop up an Android permission prompt — tap **Allow**.
This lets Termux see your phone's normal storage (like your Downloads
folder).

### Step 3 — Get the project files onto your phone

Download `flippy-chat-revived.zip` on your phone (e.g. from wherever you
saved it, or transfer it from your PC via USB/cloud storage/email to
yourself — whatever's easiest) so it ends up in your phone's **Downloads**
folder.

Back in Termux:

```
cd storage/downloads
unzip flippy-chat-revived.zip -d flippychat
cd flippychat
```

### Step 4 — Install dependencies and start the server

```
npm install
node server.js
```

You should see the same `Flippy Chat mock server running: http://localhost:8080/`
message as on desktop. Leave Termux running in the background (don't force-close
the app) — Android may eventually put it to sleep if you switch away for a
long time; if the page stops loading later, just reopen Termux and check it's
still running (`node server.js` again if not).

### Step 5 — Open it

Open Chrome (or your usual browser) **on the same phone** and go to:

```
http://localhost:8080
```

That's it — entirely self-contained on the phone, no computer involved.

### Notes

- Everything else (troubleshooting, how to play, inviting others) is the same
  as the main `README.md` — just substitute "phone" for "computer."
- If you want a second phone or PC to join, use your phone's WiFi hotspot
  and find its IP the same way as described in the main README's "Different
  computer on the same WiFi" section, then have the other device connect to
  `http://<phone's IP>:8080`.
