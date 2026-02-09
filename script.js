import { fetchAllFeeds } from "./feed.js";
import { render, showLoading, showEmpty } from "./render.js";
import {
  setupWheelScroll,
  setupHintDismiss,
  setupAutoDrift,
  setupHeaderNav,
  setupGlobalFlowToggle,
} from "./river.js";

// List of RSS feeds
const FEEDS = [
  "https://www.theverge.com/rss/index.xml",
  "https://www.theguardian.com/world/rss",
  "https://www.wired.com/feed/rss",
  "https://feeds.bbci.co.uk/news/rss.xml",
  "https://hnrss.org/frontpage",
  "https://www.techradar.com/rss",
];

/**
 * Loads all feeds, shows loading state, and renders items or empty state
 * @return {Promise<void>}
 */
async function loadFeeds() {
  showLoading();

  const items = await fetchAllFeeds(FEEDS);
  if (items.length) {
    render(items);
  } else {
    showEmpty();
  }
}

// Initialize the app
setupWheelScroll();
setupHintDismiss();
setupAutoDrift();
setupHeaderNav();
setupGlobalFlowToggle();

// Global drift control object
document.getElementById("refresh").addEventListener("click", () => {
  window.scrollTo({ top: 0 });
  document.querySelectorAll(".river-container").forEach((c) => {
    c.scrollTo({ left: 0 });
  });
  loadFeeds();
});

loadFeeds();
