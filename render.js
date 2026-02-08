// ── Card rendering & data ────────────────────────────

const CARD_VARIANTS = [
  "",
  "card--warm",
  "card--stone",
  "card--cool",
  "card--violet",
];

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

function pickQuote() {
  return ENDING_QUOTES[Math.floor(Math.random() * ENDING_QUOTES.length)];
}

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

const LOADING_MESSAGES = [
  "Listening for the current...",
  "The river is gathering...",
  "Drifting upstream to find what's new...",
];

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

export function showEmpty() {
  const rivers = document.getElementById("rivers");
  rivers.innerHTML = "";

  const el = document.createElement("div");
  el.className = "river-loading";
  el.textContent = "The river is dry today. Try again later.";
  rivers.appendChild(el);
}

export function render(feedResults) {
  const rivers = document.getElementById("rivers");
  rivers.innerHTML = "";

  feedResults.forEach((items) => {
    const sorted = [...items].sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
    );
    const feedName = sorted[0].source;

    const section = document.createElement("section");
    section.className = "feed-section";

    const labelWrap = document.createElement("div");
    labelWrap.className = "feed-label-wrap";

    const label = document.createElement("h2");
    label.className = "feed-label";
    label.textContent = feedName;

    const flowToggle = document.createElement("button");
    flowToggle.className = "flow-toggle";
    flowToggle.innerHTML = "Flow Mode";
    flowToggle.setAttribute("aria-label", "Toggle flow mode");
    flowToggle.setAttribute("data-active", "false");

    labelWrap.appendChild(label);
    labelWrap.appendChild(flowToggle);
    section.appendChild(labelWrap);

    const wrap = document.createElement("div");
    wrap.className = "river-wrap";

    // Navigation arrows
    const navLeft = document.createElement("button");
    navLeft.className = "river-nav river-nav--left";
    navLeft.innerHTML = "&larr;";
    navLeft.setAttribute("aria-label", "Scroll left");

    const navRight = document.createElement("button");
    navRight.className = "river-nav river-nav--right";
    navRight.innerHTML = "&rarr;";
    navRight.setAttribute("aria-label", "Scroll right");

    const container = document.createElement("div");
    container.className = "river-container";
    container.setAttribute("data-flow-active", "false");

    const river = document.createElement("div");
    river.className = "river";

    const total = sorted.length;
    const FADE_COUNT = 4;

    sorted.forEach((data, i) => {
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

    container.appendChild(river);
    wrap.appendChild(navLeft);
    wrap.appendChild(container);
    wrap.appendChild(navRight);

    // Add scroll handlers
    navLeft.addEventListener("click", () => {
      container.scrollBy({ left: -400, behavior: "smooth" });
    });

    navRight.addEventListener("click", () => {
      container.scrollBy({ left: 400, behavior: "smooth" });
    });

    // Flow mode toggle handler
    flowToggle.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering global pause
      const isActive = container.getAttribute("data-flow-active") === "true";
      const newState = !isActive;
      container.setAttribute("data-flow-active", newState.toString());
      flowToggle.setAttribute("data-active", newState.toString());
      flowToggle.innerHTML = newState ? "Flow Mode ✓" : "Flow Mode";

      // If enabling flow mode, make sure drift is active
      if (newState) {
        window.dispatchEvent(new CustomEvent("resume-drift"));
      }
    });

    section.appendChild(wrap);
    rivers.appendChild(section);
  });

  const ending = document.createElement("div");
  ending.className = "river-ending";
  const quote = pickQuote();
  ending.innerHTML = `
    <p class="river-ending-text">${quote.text}</p>
    <p class="river-ending-attr">${quote.attr}</p>
  `;
  rivers.appendChild(ending);
}
