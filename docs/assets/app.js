/* ------------------------------
   Small helpers
-------------------------------- */
const $ = (sel) => document.querySelector(sel);

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function toFixed2(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/* ------------------------------
   Theme
-------------------------------- */
(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    root.dataset.theme = saved;
  } else {
    // default: follow system preference (let CSS handle via color-scheme)
    // leave dataset unset for "auto"
  }
})();

$("#themeToggle")?.addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.dataset.theme || "auto";
  let next;

  if (current === "auto") next = "light";
  else if (current === "light") next = "dark";
  else next = "auto";

  if (next === "auto") {
    delete root.dataset.theme;
    localStorage.removeItem("theme");
  } else {
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  // Update icon
  const icon = $("#themeToggle .icon");
  if (icon) icon.textContent = next === "light" ? "☼" : next === "dark" ? "☾" : "◐";
});

/* ------------------------------
   Mobile menu
-------------------------------- */
$("#menuBtn")?.addEventListener("click", () => {
  const nav = $("#mobileNav");
  if (!nav) return;
  const isHidden = nav.hasAttribute("hidden");
  if (isHidden) nav.removeAttribute("hidden");
  else nav.setAttribute("hidden", "");
});

document.querySelectorAll(".mobile-nav__link").forEach((a) => {
  a.addEventListener("click", () => {
    $("#mobileNav")?.setAttribute("hidden", "");
  });
});

/* ------------------------------
   Demo Logic (browser-only)
-------------------------------- */
const freq = $("#freq");
const time = $("#time");
const trigger = $("#trigger");
const ahr = $("#ahr");
const ahrVal = $("#ahrVal");

const tBuy = $("#tBuy");
const tPause = $("#tPause");

const nIndex = $("#nIndex");
const nSuggestion = $("#nSuggestion");
const nReason = $("#nReason");
const willNotify = $("#willNotify");
const zoneName = $("#zoneName");
const nextRun = $("#nextRun");
const threshText = $("#threshText");

const tBuyLabel = $("#tBuyLabel");
const tFixLabel = $("#tFixLabel");
const tPauseLabel = $("#tPauseLabel");

// Hero sample card elements
const heroIndex = $("#heroIndex");
const heroPill = $("#heroPill");
const heroNote = $("#heroNote");

function computeZone(ahrValue, buyTh, pauseTh) {
  const b = Number(buyTh);
  const p = Number(pauseTh);

  // Guard: ensure thresholds make sense
  const buy = isFinite(b) ? b : 0.45;
  const pause = isFinite(p) ? p : 1.2;

  if (ahrValue <= buy) {
    return {
      zone: "Buy the Bottom",
      pillClass: "suggestion__pill--buy",
      reason: "Strong value zone — consider accumulating.",
      pillTone: "buy",
    };
  }

  if (ahrValue >= pause) {
    return {
      zone: "Pause",
      pillClass: "suggestion__pill--pause",
      reason: "Overheated zone — consider pausing additional buys.",
      pillTone: "pause",
    };
  }

  return {
    zone: "Fixed Investment",
    pillClass: "suggestion__pill--fix",
    reason: "In the DCA zone — consider steady, consistent investing.",
    pillTone: "fix",
  };
}

function shouldNotify(triggerMode, zone) {
  if (triggerMode === "any") return true;
  if (triggerMode === "bottom") return zone === "Buy the Bottom";
  if (triggerMode === "fixed") return zone === "Fixed Investment";
  return true;
}

function updateThresholdLabels(buyTh, pauseTh) {
  const b = Number(buyTh);
  const p = Number(pauseTh);

  const buy = isFinite(b) ? b : 0.45;
  const pause = isFinite(p) ? p : 1.2;

  if (tBuyLabel) tBuyLabel.textContent = `≤ ${toFixed2(buy)}`;
  if (tPauseLabel) tPauseLabel.textContent = `≥ ${toFixed2(pause)}`;
  if (tFixLabel) tFixLabel.textContent = `${toFixed2(buy)}–${toFixed2(pause)}`;
}

function update() {
  const ahrValue = Number(ahr?.value ?? 0.92);
  const buyTh = Number(tBuy?.value ?? 0.45);
  const pauseTh = Number(tPause?.value ?? 1.2);

  // keep thresholds sane
  const buy = clamp(buyTh, 0.01, 10);
  const pause = clamp(pauseTh, 0.01, 10);

  // If user sets buy >= pause, auto nudge pause up
  let finalBuy = buy;
  let finalPause = pause;
  if (finalBuy >= finalPause) {
    finalPause = finalBuy + 0.01;
    if (tPause) tPause.value = toFixed2(finalPause);
  }

  if (ahrVal) ahrVal.textContent = toFixed2(ahrValue);
  if (nIndex) nIndex.textContent = toFixed2(ahrValue);

  const { zone, pillClass, reason, pillTone } = computeZone(ahrValue, finalBuy, finalPause);

  if (nSuggestion) nSuggestion.textContent = zone;
  if (zoneName) zoneName.textContent = zone;
  if (nReason) nReason.textContent = reason;

  const notify = shouldNotify(trigger?.value ?? "any", zone);
  if (willNotify) willNotify.textContent = notify ? "Yes" : "No";
  if (willNotify) willNotify.style.opacity = notify ? "1" : "0.65";

  if (nextRun) {
    const f = (freq?.value ?? "daily").replace(/^\w/, (c) => c.toUpperCase());
    const tm = time?.value ?? "09:00";
    nextRun.textContent = `Next: ${f} at ${tm}`;
  }

  if (threshText) {
    threshText.textContent = `≤${toFixed2(finalBuy)} / ≥${toFixed2(finalPause)}`;
  }

  updateThresholdLabels(finalBuy, finalPause);

  // Update hero card to match the demo value (nice touch)
  if (heroIndex) heroIndex.textContent = toFixed2(ahrValue);

  if (heroPill) {
    heroPill.textContent = zone;
    heroPill.classList.remove(
      "suggestion__pill--buy",
      "suggestion__pill--fix",
      "suggestion__pill--pause"
    );
    heroPill.classList.add(pillClass);
  }

  if (heroNote) heroNote.textContent = reason;

  // Also reflect suggestion container class? (optional)
  // (keeping minimal)
}

[freq, time, trigger, ahr, tBuy, tPause].forEach((el) => {
  el?.addEventListener("input", update);
  el?.addEventListener("change", update);
});

update();

/* ------------------------------
   Footer year
-------------------------------- */
$("#year").textContent = String(new Date().getFullYear());

