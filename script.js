import { fetchAllFeeds } from "./feed.js";
import { render, showLoading, showEmpty } from "./render.js";
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

  showLoading();

  const items = await fetchAllFeeds(FEEDS);
  if (items.length) {
    render(items);
  } else {
    showEmpty();
  }
}

init();
