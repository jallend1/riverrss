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
  document.addEventListener(
    "wheel",
    (e) => {
      const container = e.target.closest(".river-container");
      if (!container) return;
      if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    },
    { passive: false },
  );
}

export function setupHintDismiss() {
  const hint = document.getElementById("hint");
  let dismissed = false;

  document.addEventListener(
    "scroll",
    () => {
      if (dismissed) return;
      dismissed = true;
      hint.classList.add("hidden");
    },
    true,
  );
}

export function setupAutoDrift() {
  const SPEED = 0.5; // 0.5 seems to be the minimum speed -- anything lower and it stops moving

  function pause(e) {
    // Don't pause if clicking the flow toggle button
    if (e && e.target && e.target.classList.contains("flow-toggle")) {
      return;
    }
    drift.pause();
  }

  document.addEventListener("wheel", pause);
  document.addEventListener("pointerdown", pause);
  document.addEventListener("touchstart", pause);
  window.addEventListener("keydown", pause);

  // Listen for resume-drift event
  window.addEventListener("resume-drift", () => {
    drift.active = true;
    clearTimeout(drift._timer);
  });

  function tick() {
    if (drift.active) {
      document.querySelectorAll(".river-container").forEach((container) => {
        const isFlowActive =
          container.getAttribute("data-flow-active") === "true";
        if (isFlowActive) {
          container.scrollLeft += SPEED;
        }
      });
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

export function setupHeaderNav() {
  document.getElementById("skipToEnd").addEventListener("click", () => {
    drift.pause(4000);
    document.querySelectorAll(".river-container").forEach((container) => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({ left: maxScroll, behavior: "smooth" });
    });
  });

  document.getElementById("skipToStart").addEventListener("click", () => {
    drift.pause(4000);
    document.querySelectorAll(".river-container").forEach((container) => {
      container.scrollTo({ left: 0, behavior: "smooth" });
    });
  });
}

export function setupGlobalFlowToggle() {
  const flowAllBtn = document.getElementById("flowAll");

  flowAllBtn.addEventListener("click", () => {
    const isActive = flowAllBtn.getAttribute("data-active") === "true";
    const newState = !isActive;

    // Update button state
    flowAllBtn.setAttribute("data-active", newState.toString());
    flowAllBtn.textContent = newState ? "Stop the rivers" : "Let the rivers rage.";

    // Toggle all river containers
    document.querySelectorAll(".river-container").forEach((container) => {
      container.setAttribute("data-flow-active", newState.toString());
    });

    // Toggle all flow toggle buttons
    document.querySelectorAll(".flow-toggle").forEach((toggle) => {
      toggle.setAttribute("data-active", newState.toString());
      toggle.innerHTML = newState ? "Flow Mode ✓" : "Flow Mode";
    });

    // If enabling, ensure drift is active
    if (newState) {
      window.dispatchEvent(new CustomEvent("resume-drift"));
    }
  });
}
