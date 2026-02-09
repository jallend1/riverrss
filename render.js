// **************************
// * Card Rendering & Data  *
// **************************

// Various card styles from CSS
const CARD_VARIANTS = [
  "",
  "card--warm",
  "card--stone",
  "card--cool",
  "card--violet",
];

// River-related quotes to show at the end of each river
const ENDING_QUOTES = [
  {
    text: "You cannot step into the same river twice.",
    attr: "Heraclitus",
  },
  {
    text: "The river is everywhere at once — at the source and at the mouth, at the waterfall, at the ferry, at the rapids, in the sea, in the mountains — everywhere at once.",
    attr: "Hermann Hesse, Siddhartha",
  },
  {
    text: "Eventually, all things merge into one, and a river runs through it.",
    attr: "Norman Maclean",
  },
  {
    text: "No man ever steps in the same river twice, for it is not the same river and he is not the same man.",
    attr: "Heraclitus",
  },
  {
    text: "The water you touch in a river is the last of what has passed and the first of what is to come.",
    attr: "Leonardo da Vinci",
  },
  {
    text: "Rivers know this: there is no hurry. We shall get there some day.",
    attr: "A.A. Milne, Winnie-the-Pooh",
  },
];

/**
 * Picks a random quote from the ENDING_QUOTES array.
 * @returns {object} A random quote object with text and attr properties.
 */
function pickQuote() {
  return ENDING_QUOTES[Math.floor(Math.random() * ENDING_QUOTES.length)];
}

/**
 * Sets up the drifting animation for the river containers, including pause on user interaction and resume on custom event.
 * @param {number} index
 * @returns {SVGElement} SVG element representing a connector between cards, with a wavy path that alternates direction based on the index.
 */
function createConnector(index) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "river-connector");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const d =
    index % 2 === 0
      ? "M 0 50 C 25 20, 75 80, 100 50"
      : "M 0 50 C 25 80, 75 20, 100 50";
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "4");
  path.setAttribute("stroke-linecap", "round");

  svg.appendChild(path);
  return svg;
}

/**
 * Creates a card element for a feed item with appropriate styles and content
 * @param {object} data - The feed item data containing source, title, body, link, and time.
 * @param {number} index - Card index for styling
 * @returns {HTMLElement} - The new card
 */
function createCard(data, index) {
  const tag = data.link ? "a" : "article";
  const el = document.createElement(tag);

  if (data.link) {
    el.href = data.link;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  }

  const variant = CARD_VARIANTS[index % CARD_VARIANTS.length];
  const rotation = (Math.random() - 0.5) * 5;

  el.className = `card ${variant}`.trim();
  el.style.setProperty("--rotation", `${rotation.toFixed(1)}deg`);
  el.style.transform = `rotate(${rotation.toFixed(1)}deg)`;
  el.style.animationDelay = `${index * 0.07}s`;

  const verticalDrift = (Math.random() - 0.5) * 30;
  el.style.marginTop = `${verticalDrift}px`;

  const time = data.time || "";

  el.innerHTML = `
    <div class="card-source">${data.source}</div>
    <h2 class="card-title">${data.title}</h2>
    ${data.body ? `<p class="card-body">${data.body}</p>` : ""}
    ${time ? `<div class="card-time">${time}</div>` : ""}
  `;

  return el;
}

// Loading messages to show while fetching
const LOADING_MESSAGES = [
  "Listening for the current...",
  "The river is gathering...",
  "Drifting upstream to find what's new...",
];

/**
 * Initializes loading state
 * @returns {void}
 */
export function showLoading() {
  const rivers = document.getElementById("rivers");
  rivers.innerHTML = "";

  const msg =
    LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];

  const el = document.createElement("div");
  el.className = "river-loading";
  el.textContent = msg;
  rivers.appendChild(el);
}

/**
 * Displays message when no feed items are available
 * @returns {void}
 */
export function showEmpty() {
  const rivers = document.getElementById("rivers");
  rivers.innerHTML = "";

  const el = document.createElement("div");
  el.className = "river-loading";
  el.textContent = "The river is dry today. Try again later.";
  rivers.appendChild(el);
}

/**
 * Creates the scroll button element
 * @param { "start" | "end" } direction - "start" for left/start button, "end" for right/end button
 * @returns {HTMLButtonElement} The scroll button element
 */
function createScrollBtn(direction) {
  const btn = document.createElement("button");
  btn.className = "river-scroll-btn";
  btn.innerHTML = direction === "start" ? "&larr; Start" : "End &rarr;";
  btn.setAttribute(
    "aria-label",
    direction === "start" ? "Scroll to beginning" : "Scroll to end",
  );
  return btn;
}

/**
 * Creates the flow toggle button element
 * @returns {HTMLButtonElement} The flow toggle button element
 */
function createFlowToggleBtn() {
  const btn = document.createElement("button");
  btn.className = "flow-toggle";
  btn.innerHTML = "Flow Mode";
  btn.setAttribute("aria-label", "Toggle flow mode");
  btn.setAttribute("data-active", "false");
  return btn;
}

/**
 * Creates a navigation arrow button element
 * @param { "left" | "right" } direction - "left" for left arrow, "right" for right arrow
 * @returns {HTMLButtonElement} The navigation arrow button element
 */
function createNavArrow(direction) {
  const btn = document.createElement("button");
  btn.className = `river-nav river-nav--${direction}`;
  btn.innerHTML = direction === "left" ? "&larr;" : "&rarr;";
  btn.setAttribute("aria-label", `Scroll ${direction}`);
  return btn;
}

/**
 * Creates the ending quote element to be displayed at the end of each river
 * @returns {HTMLDivElement} The ending quote element
 */
function createEndingQuote() {
  const quote = pickQuote();
  const el = document.createElement("div");
  el.className = "river-quote";
  el.innerHTML = `
    <p class="river-quote-text">${quote.text}</p>
    <p class="river-quote-attr">${quote.attr}</p>
  `;
  return el;
}

/**
 * Renders the feed results into the river containers
 * @param {Array<Array<object>>} feedResults - An array of feed item arrays, filled with arrays of that feed's items
 * @returns {void}
 */
export function render(feedResults) {
  const rivers = document.getElementById("rivers");
  rivers.innerHTML = "";

  feedResults.forEach((items) => {
    const sorted = [...items].sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
    );
    const feedName = sorted[0].source;

    // Controls
    const scrollToStart = createScrollBtn("start");
    const scrollToEnd = createScrollBtn("end");
    const flowToggle = createFlowToggleBtn();

    // Header label + controls
    const labelWrap = document.createElement("div");
    labelWrap.className = "feed-label-wrap";

    const label = document.createElement("h2");
    label.className = "feed-label";
    label.textContent = feedName;

    const controlsWrap = document.createElement("div");
    controlsWrap.className = "feed-controls";
    controlsWrap.append(scrollToStart, scrollToEnd, flowToggle);

    labelWrap.append(label, controlsWrap);

    // Navigation arrows
    const navLeft = createNavArrow("left");
    const navRight = createNavArrow("right");

    // River contents
    const container = document.createElement("div");
    container.className = "river-container";
    container.setAttribute("data-flow-active", "false");

    const river = document.createElement("div");
    river.className = "river";

    const total = sorted.length;
    const FADE_COUNT = 4;

    sorted.forEach((data, i) => {
      if (i > 0) {
        river.appendChild(createConnector(i - 1));
      }

      const card = createCard(data, i);

      const remaining = total - 1 - i;
      if (remaining < FADE_COUNT) {
        card.style.setProperty(
          "--card-opacity",
          ((remaining + 1) / (FADE_COUNT + 1)).toFixed(2),
        );
      }

      river.appendChild(card);
    });

    // Spacers + ending quote
    for (let i = 0; i < 2; i++) {
      const spacer = document.createElement("div");
      spacer.className = "river-spacer";
      river.appendChild(spacer);
    }
    river.appendChild(createEndingQuote());

    // Assemble section
    container.appendChild(river);

    const wrap = document.createElement("div");
    wrap.className = "river-wrap";
    wrap.append(navLeft, container, navRight);

    const section = document.createElement("section");
    section.className = "feed-section";
    section.append(labelWrap, wrap);

    // Event handlers
    navLeft.addEventListener("click", () => {
      container.scrollBy({ left: -400, behavior: "smooth" });
    });
    navRight.addEventListener("click", () => {
      container.scrollBy({ left: 400, behavior: "smooth" });
    });
    scrollToStart.addEventListener("click", () => {
      container.scrollTo({ left: 0, behavior: "smooth" });
    });
    scrollToEnd.addEventListener("click", () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({ left: maxScroll, behavior: "smooth" });
    });
    flowToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isActive = container.getAttribute("data-flow-active") === "true";
      const newState = !isActive;
      container.setAttribute("data-flow-active", newState.toString());
      flowToggle.setAttribute("data-active", newState.toString());
      flowToggle.innerHTML = newState ? "Flow Mode ✓" : "Flow Mode";
      if (newState) {
        window.dispatchEvent(new CustomEvent("resume-drift"));
      }
    });

    rivers.appendChild(section);
  });
}
