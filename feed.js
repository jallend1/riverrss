// **************************
// * RSS Fetching & Parsing *
// **************************

// Using public CORS proxies to fetch feeds to work around my CORS struggles
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

/**
 * Fetches and parses an RSS or Atom feed the URL
 * @param {string} url - URL of the RSS/Atom feed.
 * @returns {Promise<Array>} Promise that resolves to an array of feed items.
 */
export async function fetchFeed(url) {
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

/**
 * Fetches and parses multiple RSS/Atom feeds given an array of URLs.
 * @param {Array<string>} urls - Array of RSS/Atom feed URLs.
 * @returns {Promise<Array>} Promise that resolves to array of arrays of feed items.
 */
export async function fetchAllFeeds(urls) {
  const results = await Promise.all(
    urls.map((url) =>
      fetchFeed(url).catch((err) => {
        console.warn(`Feed failed: ${url}`, err);
        return [];
      }),
    ),
  );
  return results.filter((items) => items.length > 0);
}

/**
 * Parses RSS or Atom feed XML and extracts items with source, title, body, link, timestamp, and time ago.
 * @param {string} xml - The RSS or Atom feed XML as a string.
 * @returns {Array} Array of feed items with { source, title, body, link, timestamp, time }
 */
function parseFeed(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  // Detect format: RSS uses <item>, Atom uses <entry>
  const isAtom = doc.querySelector("entry") !== null;

  const feedTitle = isAtom
    ? doc.querySelector("feed > title")?.textContent || "Unknown feed"
    : doc.querySelector("channel > title")?.textContent || "Unknown feed";

  const nodes = [...doc.querySelectorAll(isAtom ? "entry" : "item")];

  const items = nodes.map((node) => {
    const dateStr = isAtom
      ? node.querySelector("updated, published")?.textContent
      : node.querySelector("pubDate")?.textContent;

    return {
      source: feedTitle,
      title: node.querySelector("title")?.textContent || "Untitled",
      body: extractBody(node, isAtom),
      link: isAtom
        ? node.querySelector("link")?.getAttribute("href") || null
        : node.querySelector("link")?.textContent || null,
      timestamp: dateStr ? new Date(dateStr).getTime() : 0,
      time: formatTimeAgo(dateStr),
    };
  });

  return items;
}

/**
 * Extracts and cleans the body text from RSS item/Atom Entry node
 * @param {Element} node
 * @param {boolean} isAtom
 * @returns {string} Cleaned body text or empty string if no real content
 */
function extractBody(node, isAtom) {
  if (isAtom) {
    const raw =
      node.querySelector("content")?.textContent ||
      node.querySelector("summary")?.textContent ||
      "";
    return cleanText(raw);
  }

  const contentEncoded =
    node.getElementsByTagNameNS(
      "http://purl.org/rss/1.0/modules/content/",
      "encoded",
    )[0]?.textContent || "";

  const description = node.querySelector("description")?.textContent || "";

  return cleanText(contentEncoded || description);
}

/**
 * Cleans HTML content and truncates to 180 chars. Also removes HackerNews metadata patterns.
 * @param {string} html
 * @returns {string} Cleaned and truncated text, or empty string if no meaningful content.
 */
function cleanText(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  tmp.querySelectorAll("a, img").forEach((el) => el.remove());

  const text = (tmp.textContent || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Detect and remove Hacker News metadata pattern
  if (
    text.includes("Article URL:") ||
    text.includes("Comments URL:") ||
    (text.includes("Points:") && text.includes("# Comments:"))
  ) {
    return "";
  }

  if (!text) return "";
  return text.length > 180 ? text.slice(0, 177) + "..." : text;
}

/**
 * Formats a date string into a "time ago" format
 * @param {string} dateStr - The date string to format.
 * @returns {string} Formatted time ago string (e.g., "5m ago", "2h ago", "3d ago", or "just now").
 */
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
