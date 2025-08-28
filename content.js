// ---------- tiny helpers ----------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Log helper with a clear prefix so you can see it in DevTools
const log = (...args) => console.log("[Exposures]", ...args);
const err = (...args) => console.error("[Exposures]", ...args);

// ---------- get tournament info (robust) ----------
function getTournamentName() {
  // Try several common patterns, then fall back to document.title
  const candidates = [
    'h1[class*="title"]',
    '[class*="title"]',
    'h1',
  ];
  for (const sel of candidates) {
    const el = qs(sel);
    if (el && el.textContent.trim()) return el.textContent.trim();
  }
  // Fallback—trim noisy site name if present
  return (document.title || "Underdog Exposures").replace(/\s*\|\s*Underdog.*$/i, "").trim();
}

function getTournamentInfo() {
  // Previously you clicked an info icon and scraped lots of values via classnames,
  // e.g., .styles__infoValue__F0R73, which are brittle. We'll just keep name + date.
  // You can add more later if you identify stable attributes on the page (e.g., data-testid).
  const name = getTournamentName();
  const today = new Date().toISOString().slice(0, 10);
  return { name, date: today };
}

// ---------- find entries & players (robust) ----------
// Old code used a specific class to find entries, but you already read the draft id from
// data-draft-pool-entry-id. We'll select *by that attribute* directly.
function findEntryCells() {
  const nodes = qsa('[data-draft-pool-entry-id]');
  log(`Found ${nodes.length} entries with data-draft-pool-entry-id`);
  return nodes;
}

// Player names: instead of .styles__playerName__uf8z0, use a wildcard on the substring.
function findPlayerNameElements() {
  // Try a few patterns for safety
  const candidates = qsa('[class*="playerName"], [data-testid*="player-name"], [class*="PlayerName"]');
  return candidates;
}

// ---------- CSV ----------
function toCSV(rows) {
  // rows: array of arrays
  return rows.map(r =>
    r.map(cell => {
      const s = String(cell ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  ).join("\n");
}

function downloadCSV(filename, rows) {
  const csvData = toCSV(rows);
  const csvBlob = new Blob([csvData], { type: "text/csv" });
  const url = URL.createObjectURL(csvBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- main workflow ----------
async function scrapeOneEntry(entryEl, tourneyInfo, rowAccumulator) {
  entryEl.click();
  const draftId = entryEl.getAttribute('data-draft-pool-entry-id') || "";
  log("Clicked entry", draftId || "(no id)");

  // Wait a moment for the lineup to render
  await sleep(400);

  const playerEls = findPlayerNameElements();
  if (!playerEls.length) {
    log("No players found on this entry yet; waiting a bit more...");
    await sleep(700);
  }

  const playerEls2 = findPlayerNameElements();
  if (!playerEls2.length) {
    err("Still no player elements—selectors may need updating for this page state.");
    return;
  }

  playerEls2.forEach((el, idx) => {
    const name = (el.textContent || "").trim();
    rowAccumulator.push([
      name,
      tourneyInfo.name,
      draftId,
      tourneyInfo.date,
      idx + 1 // pick number (best-effort as in your original)
    ]);
  });
}

async function main() {
  log("Starting Exposures scrape…");
  const tourneyInfo = getTournamentInfo();
  log("Tournament:", tourneyInfo);

  const entries = findEntryCells();
  if (!entries.length) {
    err("No entries found. Make sure you're on Drafts → Completed and a tournament is selected.");
    return;
  }

  const rows = [["Name", "Tournament", "EntryID", "Date", "PickNumber"]];

  // Iterate sequentially to avoid UI race conditions
  for (let i = 0; i < entries.length; i++) {
    await scrapeOneEntry(entries[i], tourneyInfo, rows);
    // tiny pause between entries
    await sleep(250);
  }

  const filename = `${tourneyInfo.name || "Underdog"} - ${tourneyInfo.date}.csv`;
  log(`Exporting ${rows.length - 1} rows to "${filename}"`);
  downloadCSV(filename, rows);
  log("Done.");
}

// Kick off immediately when injected
main().catch(e => err("Fatal error:", e));
