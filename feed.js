// ── RSS fetching & parsing ───────────────────────────

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

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

function cleanText(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  tmp.querySelectorAll("a, img").forEach((el) => el.remove());

  const text = (tmp.textContent || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
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
