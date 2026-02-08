// ── Card rendering & data ────────────────────────────

export const FALLBACK_CARDS = [
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

  const verticalDrift = (Math.random() - 0.5) * 60;
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

export function render(cards) {
  const river = document.getElementById("river");
  river.innerHTML = "";

  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  const total = shuffled.length;
  const FADE_COUNT = 4;

  shuffled.forEach((data, i) => {
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

  const ending = document.createElement("div");
  ending.className = "river-ending";
  const quote = pickQuote();
  ending.innerHTML = `
    <p class="river-ending-text">${quote.text}</p>
    <p class="river-ending-attr">${quote.attr}</p>
  `;
  river.appendChild(ending);
}
