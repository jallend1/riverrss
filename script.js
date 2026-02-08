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

// ── Load feeds ───────────────────────────────────────

async function loadFeeds() {
  showLoading();

  const items = await fetchAllFeeds(FEEDS);
  if (items.length) {
    render(items);
  } else {
    showEmpty();
  }
}

// ── Init ─────────────────────────────────────────────

setupWheelScroll();
setupHintDismiss();
setupAutoDrift();
setupHeaderNav();

document.getElementById("refresh").addEventListener("click", () => {
  document.querySelector(".river-container").scrollTo({ left: 0 });
  loadFeeds();
});

loadFeeds();
