// Mock htfgames.com "Flippy Chat" server, reconstructed from reverse-engineering chat.swf.
// Implements login.php / new.php / register.php / forgotpassword.php / editaccount.php /
// wait.php / join.php / chat.php / drop.php exactly as the client expects them.

const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// ---- in-memory state -------------------------------------------------

const players = new Map(); // id -> {id,key,name,character,direction,x,y,room,lastSeen}
const outbox = new Map(); // id -> array of pending lines for that player
const accounts = new Map(); // name -> {password, email}
let nextId = 1;

const IDLE_TIMEOUT_MS = 60_000; // drop a player if they haven't polled in this long
const REAP_INTERVAL_MS = 15_000;

function touch(p) {
  if (p) p.lastSeen = Date.now();
}

function dropPlayer(p) {
  if (p.room != null) broadcast(p.room, p.id, String(p.id)); // single-field line = drop
  players.delete(p.id);
  outbox.delete(p.id);
}

setInterval(() => {
  const now = Date.now();
  for (const p of [...players.values()]) {
    if (now - p.lastSeen > IDLE_TIMEOUT_MS) {
      console.log(`Reaping idle player ${p.id} (${p.name})`);
      dropPlayer(p);
    }
  }
}, REAP_INTERVAL_MS);

function genKey() {
  return crypto.randomBytes(4).toString("hex").slice(0, 4);
}

function roomOf(id) {
  return players.get(id)?.room;
}

function broadcast(room, fromId, line) {
  for (const p of players.values()) {
    if (p.room === room && p.id !== fromId) {
      if (!outbox.has(p.id)) outbox.set(p.id, []);
      outbox.get(p.id).push(line);
    }
  }
}

// findCode: same base-62-ish packing chat.swf uses for direction/x/y
function findCode(n) {
  n = Number(n);
  if (n < 10) return String(n);
  if (n < 36) return String.fromCharCode(n + 55);
  return String.fromCharCode(n + 61);
}
function findNumber(c) {
  if (c >= "0" && c <= "9") return Number(c);
  const code = c.charCodeAt(0);
  if (code < 91) return code - 55;
  return code - 61;
}

function playerLine(p, chatText) {
  // id|character|dirCode|xCode|yCode|chatText
  return `${p.id}|${p.character}|${findCode(p.direction)}|${findCode(p.x)}|${findCode(p.y)}|${chatText ?? ""}`;
}

function respond(res, fields) {
  const body = Object.entries(fields)
    .map(([k, v]) => `${k}=${v === undefined ? "" : v}`)
    .join("&");
  res.type("text/plain").send("&" + body);
}

// ---- account endpoints -------------------------------------------------

app.post("/login.php", (req, res) => {
  const { n, p } = req.body;
  const acct = accounts.get(n);
  if (!acct) return respond(res, { e: 14 }); // username doesn't exist
  if (acct.password !== p) return respond(res, { e: 15 }); // wrong password

  const id = nextId++;
  const key = genKey();
  players.set(id, { id, key, name: n, character: 1, direction: 1, x: 0, y: 0, room: null, lastSeen: Date.now() });
  outbox.set(id, []);
  respond(res, { id, k: key, e: 0, m: 0, email: acct.email || "", p1: "", p2: "", p3: "" });
});

app.post("/new.php", (req, res) => {
  // used both for "create account" and for guest join (n_gen=1)
  const { n } = req.body;
  const id = nextId++;
  const key = genKey();
  players.set(id, { id, key, name: n, character: 1, direction: 1, x: 0, y: 0, room: null, lastSeen: Date.now() });
  outbox.set(id, []);
  respond(res, { id, k: key, e: 0 });
});

app.post("/register.php", (req, res) => {
  const { n, p, email } = req.body;
  if (accounts.has(n)) return respond(res, { e: 17 }); // name taken (mock code)
  accounts.set(n, { password: p, email });
  respond(res, { e: 0 });
});

app.post("/forgotpassword.php", (req, res) => {
  respond(res, { e: 0 }); // mock: pretend an email was sent
});

app.post("/editaccount.php", (req, res) => {
  const { n, newpassword, email } = req.body;
  const acct = accounts.get(n);
  if (!acct) return respond(res, { e: 14 });
  if (newpassword) acct.password = newpassword;
  if (email) acct.email = email;
  respond(res, { e: 0 });
});

app.post("/wait.php", (req, res) => {
  const p = players.get(Number(req.body.id));
  touch(p);
  respond(res, {}); // simple heartbeat, no fields required
});

// ---- room endpoints -------------------------------------------------

app.post("/join.php", (req, res) => {
  const { id, k, r, s } = req.body;
  const p = players.get(Number(id));
  if (!p || p.key !== k) return respond(res, { e: 1 });
  touch(p);

  const [character, dirCode, xCode, yCode] = (s || "").split("|");
  p.character = character || p.character;
  p.direction = dirCode !== undefined ? findNumber(dirCode) : p.direction;
  p.x = xCode !== undefined ? findNumber(xCode) : p.x;
  p.y = yCode !== undefined ? findNumber(yCode) : p.y;
  p.room = Number(r);

  // roster dump of everyone else already in the room, each line carries the
  // player's name in the "chat" slot so the client's addPlayer() picks it up
  const lines = [];
  for (const other of players.values()) {
    if (other.room === p.room && other.id !== p.id) {
      lines.push(playerLine(other, other.name));
    }
  }
  // announce the new arrival to everyone else already there
  broadcast(p.room, p.id, playerLine(p, p.name));
  outbox.set(p.id, []); // fresh queue going forward

  respond(res, { p: lines.join("\n"), l: Date.now(), e: 0 });
});

app.post("/chat.php", (req, res) => {
  const { id, k, r, s, d } = req.body;
  const p = players.get(Number(id));
  if (!p || p.key !== k) return respond(res, { e: 1 });
  touch(p);

  if (s !== undefined && s !== "") {
    const [character, dirCode, xCode, yCode] = s.split("|");
    p.character = character || p.character;
    p.direction = dirCode !== undefined ? findNumber(dirCode) : p.direction;
    p.x = xCode !== undefined ? findNumber(xCode) : p.x;
    p.y = yCode !== undefined ? findNumber(yCode) : p.y;
    broadcast(p.room, p.id, playerLine(p, d));
  }

  const pending = outbox.get(p.id) || [];
  outbox.set(p.id, []);
  respond(res, { c: pending.join("\n"), l: Date.now(), e: 0 });
});

app.post("/drop.php", (req, res) => {
  const { id, k } = req.body;
  const p = players.get(Number(id));
  if (!p) return respond(res, { e: 0 });
  dropPlayer(p);
  respond(res, { e: 0 });
});

// ---- boot -------------------------------------------------

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Flippy Chat mock server running: http://localhost:${PORT}/`);
});
