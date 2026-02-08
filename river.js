// ── Scroll behavior, drift & navigation ──────────────

export const drift = {
  active: true,
  _timer: null,

  pause(ms = 2000) {
    this.active = false;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.active = true;
    }, ms);
  },

  stop() {
    this.active = false;
    clearTimeout(this._timer);
  },
};

export function setupWheelScroll() {
  const container = document.querySelector(".river-container");

  container.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    },
    { passive: false },
  );
}

export function setupHintDismiss() {
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

export function setupAutoDrift() {
  const container = document.querySelector(".river-container");
  const SPEED = 0.4;

  function pause() {
    drift.pause();
  }

  container.addEventListener("wheel", pause);
  container.addEventListener("pointerdown", pause);
  container.addEventListener("touchstart", pause);
  window.addEventListener("keydown", pause);

  function tick() {
    if (drift.active) {
      container.scrollLeft += SPEED;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

export function setupHeaderNav() {
  const container = document.querySelector(".river-container");

  document.getElementById("skipToEnd").addEventListener("click", () => {
    const ending = document.querySelector(".river-ending");
    if (!ending) return;
    drift.stop();
    ending.scrollIntoView({ behavior: "smooth", inline: "center" });
  });

  document.getElementById("skipToStart").addEventListener("click", () => {
    drift.pause(4000);
    container.scrollTo({ left: 0, behavior: "smooth" });
  });
}
