import { fetchAllFeeds } from "./feed.js";
import { render, FALLBACK_CARDS } from "./render.js";
import {
  setupWheelScroll,
  setupHintDismiss,
  setupAutoDrift,
  setupHeaderNav,
} from "./river.js";

// ── Configuration ────────────────────────────────────

const FEEDS = [
  "https://www.theverge.com/rss/index.xml",
  "https://www.theguardian.com/world/rss",
  "https://www.wired.com/feed/rss",
];

// ── Init ─────────────────────────────────────────────

async function init() {
  setupWheelScroll();
  setupHintDismiss();
  setupAutoDrift();
  setupHeaderNav();

  render(FALLBACK_CARDS);

  const items = await fetchAllFeeds(FEEDS);
  if (items.length) render(items);
}

init();
