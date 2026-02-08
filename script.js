// ── Configuration ────────────────────────────────────

const FEEDS = [
  "https://www.theverge.com/rss/index.xml",
  "https://www.theguardian.com/world/rss",
  "https://www.wired.com/feed/rss",
];

// CORS proxies (try in order; public proxies can be flaky)
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

// ── RSS fetching & parsing ───────────────────────────

async function fetchFeed(url) {
  let lastErr;
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url));
      if (!res.ok) throw new Error(`status ${res.status}`);
      const xml = await res.text();
      return parseFeed(xml);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`All proxies failed. Last error: ${lastErr?.message}`);
}

function parseFeed(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  // Detect format: RSS uses <item>, Atom uses <entry>
  const isAtom = doc.querySelector("entry") !== null;

  const feedTitle = isAtom
    ? doc.querySelector("feed > title")?.textContent || "Unknown feed"
    : doc.querySelector("channel > title")?.textContent || "Unknown feed";

  const nodes = [...doc.querySelectorAll(isAtom ? "entry" : "item")];

  const items = nodes.map((node) => ({
    source: feedTitle,
    title: node.querySelector("title")?.textContent || "Untitled",
    body: extractBody(node, isAtom),
    link: isAtom
      ? node.querySelector("link")?.getAttribute("href") || null
      : node.querySelector("link")?.textContent || null,
    time: formatTimeAgo(
      isAtom
        ? node.querySelector("updated, published")?.textContent
        : node.querySelector("pubDate")?.textContent,
    ),
  }));

  return items;
}

function extractBody(node, isAtom) {
  if (isAtom) {
    // Atom: prefer <content>, fall back to <summary>
    const raw =
      node.querySelector("content")?.textContent ||
      node.querySelector("summary")?.textContent ||
      "";
    return cleanText(raw);
  }

  // RSS: prefer <content:encoded>, fall back to <description>
  const contentEncoded =
    node.getElementsByTagNameNS(
      "http://purl.org/rss/1.0/modules/content/",
      "encoded",
    )[0]?.textContent || "";

  const description = node.querySelector("description")?.textContent || "";

  return cleanText(contentEncoded || description);
}

function cleanText(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  // Remove any leftover links/images so we get prose only
  tmp.querySelectorAll("a, img").forEach((el) => el.remove());

  const text = (tmp.textContent || "")
    .replace(/https?:\/\/\S+/g, "") // strip stray URLs
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();

  if (!text) return "";
  return text.length > 180 ? text.slice(0, 177) + "..." : text;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Fallback dummy cards (shown if fetch fails) ──────

const FALLBACK_CARDS = [
  {
    source: "Daydream",
    title: "The library at the end of the internet",
    body: "Imagine a place where every abandoned blog post ends up, quietly shelved and waiting for someone to wander in.",
  },
  {
    source: "Field notes",
    title: "Why do birds sing at 4am?",
    body: "It's called the dawn chorus. The air is still, sound carries further, and there's nothing else to do yet.",
  },
  {
    source: "Workshop",
    title: "Small tools that do one thing well",
    body: "A pencil. A pocketknife. A single-purpose command-line utility. There's beauty in restraint.",
  },
  {
    source: "Postcard",
    title: "Fog over the valley this morning",
    body: "Everything below the ridgeline erased. Just treetops floating in white. Gone by 9am like it never happened.",
  },
  {
    source: "Fragment",
    title: "The color of 6am",
    body: "Not blue, not grey. Something that doesn't have a name in English. The Japanese call it tasogare — the hour when you can't tell faces apart.",
  },
];

// ── Color palette for cards ──────────────────────────

const CARD_VARIANTS = [
  "",
  "card--warm",
  "card--stone",
  "card--cool",
  "card--violet",
];

// ── Render ───────────────────────────────────────────

function createCard(data, index) {
  // Use <a> if the card has a link, otherwise <article>
  const tag = data.link ? "a" : "article";
  const el = document.createElement(tag);

  if (data.link) {
    el.href = data.link;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  }

  // Pick a color
  const variant = CARD_VARIANTS[index % CARD_VARIANTS.length];

  // Small organic rotation between -2.5° and 2.5°
  const rotation = (Math.random() - 0.5) * 5;

  el.className = `card ${variant}`.trim();
  el.style.setProperty("--rotation", `${rotation.toFixed(1)}deg`);
  el.style.transform = `rotate(${rotation.toFixed(1)}deg)`;
  el.style.animationDelay = `${index * 0.07}s`;

  // Slight vertical offset to break the rigid line
  const drift = (Math.random() - 0.5) * 60;
  el.style.marginTop = `${drift}px`;

  const time = data.time || "";

  el.innerHTML = `
    <div class="card-source">${data.source}</div>
    <h2 class="card-title">${data.title}</h2>
    ${data.body ? `<p class="card-body">${data.body}</p>` : ""}
    ${time ? `<div class="card-time">${time}</div>` : ""}
  `;

  return el;
}

function render(cards) {
  const river = document.getElementById("river");
  river.innerHTML = "";

  // Shuffle so each visit feels different
  const shuffled = [...cards].sort(() => Math.random() - 0.5);

  shuffled.forEach((data, i) => {
    river.appendChild(createCard(data, i));
  });
}

// ── Horizontal scroll via mouse wheel ────────────────
// Translates vertical wheel movement into horizontal scroll
// so you can drift through with a normal scroll gesture.

function setupWheelScroll() {
  const container = document.querySelector(".river-container");

  container.addEventListener(
    "wheel",
    (e) => {
      // Only hijack if it's a vertical scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    },
    { passive: false },
  );
}

// ── Hide hint after first scroll ─────────────────────

function setupHintDismiss() {
  const container = document.querySelector(".river-container");
  const hint = document.getElementById("hint");
  let dismissed = false;

  container.addEventListener("scroll", () => {
    if (!dismissed && container.scrollLeft > 40) {
      dismissed = true;
      hint.classList.add("hidden");
    }
  });
}

// ── Auto-drift ───────────────────────────────────────
// The river drifts slowly on its own. Any interaction
// pauses the drift; it resumes after a quiet moment.

function setupAutoDrift() {
  const container = document.querySelector(".river-container");
  const SPEED = 0.4; // px per frame — very gentle
  const RESUME_DELAY = 2000; // ms of inactivity before drift resumes
  let drifting = true;
  let resumeTimer = null;

  function pause() {
    drifting = false;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      drifting = true;
    }, RESUME_DELAY);
  }

  // Pause on any interaction
  container.addEventListener("wheel", pause);
  container.addEventListener("pointerdown", pause);
  container.addEventListener("touchstart", pause);
  window.addEventListener("keydown", pause);

  function tick() {
    if (drifting) {
      container.scrollLeft += SPEED;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── Init ─────────────────────────────────────────────

async function fetchAllFeeds(urls) {
  // Fetch all feeds in parallel; failures return empty arrays
  const results = await Promise.all(
    urls.map((url) =>
      fetchFeed(url).catch((err) => {
        console.warn(`Feed failed: ${url}`, err);
        return [];
      }),
    ),
  );
  return results.flat();
}

async function init() {
  setupWheelScroll();
  setupHintDismiss();
  setupAutoDrift();

  // Show fallback cards while feeds load
  render(FALLBACK_CARDS);

  const items = await fetchAllFeeds(FEEDS);
  if (items.length) render(items);
}

init();
