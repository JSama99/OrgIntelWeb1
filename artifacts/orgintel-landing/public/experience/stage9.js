(() => {
  "use strict";

  const PROGRESS_KEY = "orgintel-hq-progress-v1";
  const ANALYTICS_KEY = "orgintel-hq-analytics-v1";
  const PREF_KEY = "orgintel-hq-analytics-enabled-v1";
  const APP_URL = "https://orgintell.replit.app";
  const MAX_EVENTS = 120;
  const startedAt = performance.now();
  const sessionId =
    window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1";
  const rooms = [
    {
      name: "Memory Archive",
      flag: "memoryComplete",
      station: "Memory Archive",
      summary: "Connected organizational memory",
    },
    {
      name: "Decision Chamber",
      flag: "decisionComplete",
      station: "Decision Chamber",
      summary: "Explainable organizational decisions",
    },
    {
      name: "Proof Vault",
      flag: "proofComplete",
      station: "Proof Vault",
      summary: "Verifiable records and provenance",
    },
    {
      name: "Intelligence Observatory",
      flag: "observatoryComplete",
      station: "Observatory",
      summary: "Patterns, risks, and opportunities",
    },
    {
      name: "Operational Console",
      flag: "journeyComplete",
      station: "The Console",
      summary: "Coordinated human and agent action",
    },
  ];

  let modal = null;
  let progressButton = null;
  let lastFocus = null;
  let toastTimer = null;
  let commandRail = null;
  let railSignature = "";
  let modalSignature = "";
  let previousCompletion = [];
  const openedLessons = new Set();

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function readProgress() {
    return readJson(PROGRESS_KEY, {});
  }

  function analyticsEnabled() {
    try {
      const saved = localStorage.getItem(PREF_KEY);
      if (saved === "enabled") return true;
      if (saved === "disabled") return false;
    } catch (_) {}
    return !dnt;
  }

  function setAnalyticsEnabled(enabled) {
    try {
      localStorage.setItem(PREF_KEY, enabled ? "enabled" : "disabled");
    } catch (_) {}
    if (!enabled) {
      try {
        localStorage.removeItem(ANALYTICS_KEY);
      } catch (_) {}
    } else {
      track("measurement_enabled");
    }
    renderModal();
    showNotice(
      enabled
        ? "On-device measurement enabled"
        : "On-device measurement disabled",
    );
  }

  function safeDetail(detail) {
    const allowed = [
      "room",
      "placement",
      "action",
      "count",
      "seconds",
      "milestone",
    ];
    const clean = {};
    allowed.forEach((key) => {
      const value = detail[key];
      if (typeof value === "string") clean[key] = value.slice(0, 80);
      if (typeof value === "number" && Number.isFinite(value))
        clean[key] = value;
    });
    return clean;
  }

  function track(name, detail = {}) {
    if (!analyticsEnabled()) return;
    const store = readJson(ANALYTICS_KEY, { version: 1, events: [] });
    const event = {
      name: String(name).slice(0, 64),
      at: new Date().toISOString(),
      sessionId,
      path: "/experience/",
      viewport:
        innerWidth < 721 ? "mobile" : innerWidth < 1100 ? "tablet" : "desktop",
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      ...safeDetail(detail),
    };
    store.version = 1;
    store.events = Array.isArray(store.events)
      ? store.events.slice(-(MAX_EVENTS - 1))
      : [];
    store.events.push(event);
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(store));
    } catch (_) {}
    dispatchEvent(new CustomEvent("orgintel:analytics", { detail: event }));
  }

  function analyticsSnapshot() {
    const store = readJson(ANALYTICS_KEY, { version: 1, events: [] });
    const events = Array.isArray(store.events) ? store.events : [];
    return {
      enabled: analyticsEnabled(),
      eventCount: events.length,
      interactionCount: events.filter((e) => e.name === "lesson_interaction")
        .length,
      launchCount: events.filter((e) => e.name === "cta_clicked").length,
      completedCount: events.filter((e) => e.name === "room_completed").length,
    };
  }

  function completionState(progress = readProgress()) {
    return rooms.map((room) => !!progress[room.flag]);
  }

  function completedCount(progress = readProgress()) {
    return completionState(progress).filter(Boolean).length;
  }

  function nextRoom(progress = readProgress()) {
    const state = completionState(progress);
    const index = state.findIndex((done) => !done);
    return index === -1 ? null : rooms[index];
  }

  function showNotice(message) {
    let toast = document.getElementById("stage9Toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "stage9Toast";
      toast.className = "stage9-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("on"), 1800);
  }

  function ensureProgressButton() {
    if (progressButton) return progressButton;
    const hud = document.querySelector(".hud-right");
    if (!hud) return null;
    progressButton = document.createElement("button");
    progressButton.className = "pill stage9-progress-pill";
    progressButton.type = "button";
    progressButton.setAttribute(
      "aria-label",
      "Open headquarters journey status",
    );
    progressButton.addEventListener("click", () => openModal("hud"));
    hud.insertBefore(progressButton, document.getElementById("tourBtn"));
    return progressButton;
  }

  function ensureCinematicShell() {
    if (!document.getElementById("stage9Atmosphere")) {
      const atmosphere = document.createElement("div");
      atmosphere.id = "stage9Atmosphere";
      atmosphere.className = "stage9-atmosphere";
      atmosphere.setAttribute("aria-hidden", "true");
      document.body.appendChild(atmosphere);
    }
    if (!document.getElementById("stage9WorldTitle")) {
      const title = document.createElement("div");
      title.id = "stage9WorldTitle";
      title.className = "stage9-world-title";
      title.innerHTML =
        "<strong>3D Intelligence Headquarters</strong><span>Full interactive experience</span>";
      document.body.appendChild(title);
    }
    if (!document.getElementById("stage9CapabilityRail")) {
      const capabilities = document.createElement("aside");
      capabilities.id = "stage9CapabilityRail";
      capabilities.className = "stage9-capability-rail";
      capabilities.setAttribute(
        "aria-label",
        "Cinematic experience capabilities and controls",
      );
      capabilities.innerHTML = `<h2>Cinematic experience</h2>
        <div class="stage9-capability"><i>3D</i><span><strong>Real-time headquarters</strong><small>Smooth WebGL navigation through a living organization.</small></span></div>
        <div class="stage9-capability"><i>OI</i><span><strong>Interactive intelligence</strong><small>Relationships and lessons respond as you explore.</small></span></div>
        <div class="stage9-capability"><i>FX</i><span><strong>Adaptive visuals</strong><small>Bloom, lighting, models, and quality scale by device.</small></span></div>
        <div class="stage9-capability"><i>AX</i><span><strong>Accessible immersion</strong><small>Keyboard, touch, reduced motion, and focused dialogs.</small></span></div>
        <div class="stage9-controls"><h3>Controls</h3><div class="stage9-control-row"><b>W A S D</b><span>Walk</span></div><div class="stage9-control-row"><b>DRAG</b><span>Look around</span></div><div class="stage9-control-row"><b>E</b><span>Interact</span></div><div class="stage9-control-row"><b>SCROLL</b><span>Zoom</span></div></div>`;
      document.body.appendChild(capabilities);
    }
    if (!commandRail) {
      commandRail = document.createElement("aside");
      commandRail.id = "stage9CommandRail";
      commandRail.className = "stage9-command-rail";
      commandRail.setAttribute("aria-label", "Headquarters room navigator");
      commandRail.addEventListener("click", handleRailClick);
      document.body.appendChild(commandRail);
    }
    return commandRail;
  }

  function renderCommandRail() {
    const rail = ensureCinematicShell();
    const progress = readProgress();
    const state = completionState(progress);
    const count = state.filter(Boolean).length;
    const next = nextRoom(progress);
    const collapsed = rail.classList.contains("collapsed");
    const signature = `${state.join("")}|${collapsed}`;
    if (signature === railSignature) return;
    railSignature = signature;
    const roomButtons = rooms
      .map((room, index) => {
        const done = state[index];
        const isNext = next && next.name === room.name;
        const available = done || isNext || index === 0;
        return `<button class="stage9-rail-room ${done ? "done" : ""} ${isNext ? "next" : ""}" data-stage9-station="${room.station}" data-stage9-room="${room.name}" ${available ? "" : "disabled"}>
        <span class="stage9-rail-icon">${done ? "✓" : index + 1}</span><span><strong>${room.name}</strong><small>${room.summary}</small></span><span class="stage9-rail-state">${done ? "done" : isNext ? "next" : "locked"}</span></button>`;
      })
      .join("");
    rail.innerHTML = `<div class="stage9-rail-head"><span>Headquarters</span><button data-stage9-rail="toggle" aria-label="${collapsed ? "Expand" : "Collapse"} headquarters navigator">${collapsed ? "←" : "→"}</button></div><div class="stage9-rail-rooms">${roomButtons}</div><div class="stage9-rail-progress"><div><span>Your progress</span><b>${count}/${rooms.length}</b></div><span><i style="width:${(count / rooms.length) * 100}%"></i></span></div>`;
  }

  function handleRailClick(event) {
    const toggle = event.target.closest("[data-stage9-rail='toggle']");
    if (toggle) {
      commandRail.classList.toggle("collapsed");
      railSignature = "";
      renderCommandRail();
      return;
    }
    const target = event.target.closest("[data-stage9-station]");
    if (!target || target.disabled) return;
    const hq = window.OrgIntelHQ;
    if (hq && typeof hq.moveTowardStation === "function") {
      hq.moveTowardStation(target.dataset.stage9Station);
      track("room_navigation_clicked", {
        room: target.dataset.stage9Room,
        placement: "command-rail",
      });
      showNotice(`Navigating to ${target.dataset.stage9Room}`);
    }
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "stage9Modal";
    modal.className = "stage9-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "stage9Title");
    modal.innerHTML = '<div class="stage9-shell" id="stage9Shell"></div>';
    modal.addEventListener("click", handleModalClick);
    document.body.appendChild(modal);
    return modal;
  }

  function renderModal() {
    if (!modal) return;
    const progress = readProgress();
    const state = completionState(progress);
    const count = state.filter(Boolean).length;
    const next = nextRoom(progress);
    const snapshot = analyticsSnapshot();
    const signature = `${state.join("")}|${snapshot.enabled}|${snapshot.eventCount}|${snapshot.interactionCount}|${snapshot.launchCount}|${snapshot.completedCount}`;
    if (signature === modalSignature) return;
    modalSignature = signature;
    const list = rooms
      .map((room, index) => {
        const done = state[index];
        const current = next && room.name === next.name;
        return `<div class="stage9-room ${done ? "done" : ""} ${current ? "current" : ""}">
        <span class="num">${done ? "✓" : index + 1}</span><div><strong>${room.name}</strong><small>${room.summary}</small></div>
        <span class="state">${done ? "complete" : current ? "next" : "locked"}</span></div>`;
      })
      .join("");
    const primary = next
      ? `<button class="stage9-btn primary" data-stage9-action="resume">Resume at ${next.name} →</button>`
      : `<a class="stage9-btn gold" href="${APP_URL}" data-stage9-cta="journey-panel">Launch your OrgIntel workspace →</a>`;
    const secondary =
      count >= 3 && next
        ? `<a class="stage9-btn" href="${APP_URL}" data-stage9-cta="journey-panel-early">Preview OrgIntel</a>`
        : "";
    document.getElementById("stage9Shell").innerHTML = `
      <button class="stage9-close" data-stage9-action="close" aria-label="Close journey status">✕</button>
      <span class="stage9-kicker">Stage 9 · Experience control</span>
      <h2 class="stage9-title" id="stage9Title">${count === rooms.length ? "Your headquarters journey is complete." : "Continue your headquarters journey."}</h2>
      <p class="stage9-lede">See what you have learned, return to the next room, and decide when you are ready to put Organizational Intelligence to work.</p>
      <div class="stage9-meter"><div class="stage9-meter-head"><span>Learning progress</span><b>${count} / ${rooms.length} rooms</b></div><div class="stage9-meter-track"><span style="width:${(count / rooms.length) * 100}%"></span></div></div>
      <div class="stage9-room-list">${list}</div>
      <div class="stage9-actions">${primary}${secondary}<button class="stage9-btn" data-stage9-action="tour">Guided tour</button></div>
      <div class="stage9-insights"><div class="stage9-stat"><b>${snapshot.interactionCount}</b><span>lesson actions</span></div><div class="stage9-stat"><b>${snapshot.completedCount}</b><span>completion events</span></div><div class="stage9-stat"><b>${snapshot.launchCount}</b><span>launch clicks</span></div></div>
      <div class="stage9-privacy"><div class="stage9-privacy-top"><div><strong>Private experience measurement</strong><p>Stores limited interaction events only on this device. No names, prompts, document content, referrers, or third-party trackers are collected. Do Not Track is respected by default.</p></div><label class="stage9-switch"><input id="stage9Measure" type="checkbox" ${snapshot.enabled ? "checked" : ""} aria-label="Enable on-device experience measurement"><span></span></label></div><button class="stage9-clear" data-stage9-action="clear">Clear on-device measurements</button></div>`;
  }

  function openModal(placement = "unknown") {
    ensureModal();
    lastFocus = document.activeElement;
    modalSignature = "";
    renderModal();
    modal.classList.add("on");
    document.body.classList.add("stage9-open");
    track("journey_panel_opened", { placement, count: completedCount() });
    requestAnimationFrame(() => modal.querySelector(".stage9-close").focus());
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("on");
    document.body.classList.remove("stage9-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function resumeJourney() {
    const next = nextRoom();
    closeModal();
    if (!next) return;
    const lobby = document.getElementById("lobby");
    if (lobby) lobby.classList.add("gone");
    const hq = window.OrgIntelHQ;
    if (hq && typeof hq.moveTowardStation === "function") {
      hq.moveTowardStation(next.station);
      track("journey_resumed", { room: next.name });
      showNotice(`Moving toward ${next.name}`);
    }
  }

  function handleModalClick(event) {
    const target = event.target.closest("button, a, input");
    if (!target) return;
    if (target.id === "stage9Measure") {
      setAnalyticsEnabled(target.checked);
      return;
    }
    const action = target.dataset.stage9Action;
    if (action === "close") closeModal();
    if (action === "resume") resumeJourney();
    if (action === "tour") {
      closeModal();
      const button = document.getElementById("tourBtn");
      if (button) button.click();
      track("guided_tour_started", { placement: "journey-panel" });
    }
    if (action === "clear") {
      try {
        localStorage.removeItem(ANALYTICS_KEY);
      } catch (_) {}
      renderModal();
      showNotice("On-device measurements cleared");
    }
  }

  function enhanceCompletion() {
    const finalStep = document.getElementById("ocStep13");
    if (!finalStep || finalStep.dataset.stage9Enhanced) return;
    finalStep.dataset.stage9Enhanced = "true";
    const launch = finalStep.querySelector(`a[href="${APP_URL}"]`);
    if (launch) {
      launch.textContent = "Launch your OrgIntel workspace →";
      launch.dataset.stage9Cta = "stage8-completion";
    }
    const complete = finalStep.querySelector(".ml-complete");
    if (complete) {
      const proof = document.createElement("div");
      proof.className = "stage9-conversion-proof";
      proof.innerHTML =
        "<span>Memory connected</span><span>Decisions explained</span><span>Proof verified</span><span>Action coordinated</span>";
      const note = document.createElement("p");
      note.className = "stage9-conversion-note";
      note.textContent =
        "Start with the same operating loop you just completed. Your records remain yours to keep and prove.";
      const row = complete.querySelector(".row");
      if (row) {
        complete.insertBefore(proof, row);
        complete.insertBefore(note, row);
      }
    }
  }

  function refreshProgress() {
    const button = ensureProgressButton();
    if (!button) return;
    const progress = readProgress();
    const state = completionState(progress);
    const count = state.filter(Boolean).length;
    if (button.dataset.stage9Count !== String(count)) {
      button.dataset.stage9Count = String(count);
      button.innerHTML = `<span class="stage9-dot"></span><span class="stage9-label">journey</span> ${count}/${rooms.length}`;
    }
    button.classList.toggle("complete", count === rooms.length);
    button.setAttribute(
      "aria-label",
      `Open headquarters journey status, ${count} of ${rooms.length} rooms complete`,
    );
    const lobby = document.getElementById("lobby");
    document.body.classList.toggle(
      "stage9-exploring",
      !!lobby && lobby.classList.contains("gone"),
    );
    state.forEach((done, index) => {
      if (done && !previousCompletion[index]) {
        track("room_completed", { room: rooms[index].name, count });
      }
    });
    if (state[rooms.length - 1] && !previousCompletion[rooms.length - 1]) {
      track("journey_completed", {
        milestone: "headquarters",
        seconds: Math.round((performance.now() - startedAt) / 1000),
      });
    }
    previousCompletion = state;
    renderCommandRail();
    if (modal && modal.classList.contains("on")) renderModal();
  }

  function detectOpenLessons() {
    const lessonMap = [
      ["memLesson", "Memory Archive"],
      ["decisionLesson", "Decision Chamber"],
      ["proofLesson", "Proof Vault"],
      ["observatoryLesson", "Intelligence Observatory"],
      ["ocLesson", "Operational Console"],
    ];
    lessonMap.forEach(([id, room]) => {
      const element = document.getElementById(id);
      const open =
        !!element &&
        (element.classList.contains("on") || element.style.display === "flex");
      if (open && !openedLessons.has(id)) {
        openedLessons.add(id);
        track("room_opened", { room });
      }
      if (!open) openedLessons.delete(id);
    });
  }

  function handleDocumentClick(event) {
    const cta = event.target.closest(`a[href^="${APP_URL}"]`);
    if (cta)
      track("cta_clicked", {
        placement: cta.dataset.stage9Cta || "existing-experience",
      });
    if (event.target.closest(".ml-btn, .dc-btn, .pv-btn, .io-btn, .interact")) {
      track("lesson_interaction", { action: "button" });
      setTimeout(refreshProgress, 0);
    }
  }

  function trapFocus(event) {
    if (!modal || !modal.classList.contains("on")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [
      ...modal.querySelectorAll(
        "button:not([disabled]),a[href],input:not([disabled])",
      ),
    ];
    if (!focusable.length) return;
    const first = focusable[0],
      last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function boot() {
    ensureProgressButton();
    ensureCinematicShell();
    ensureModal();
    enhanceCompletion();
    previousCompletion = completionState();
    refreshProgress();
    track("experience_started", { count: completedCount() });
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("keydown", trapFocus, true);
    const observer = new MutationObserver(() => {
      detectOpenLessons();
      refreshProgress();
      enhanceCompletion();
    });
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class", "style"],
    });
    addEventListener("storage", refreshProgress);
    addEventListener("focus", refreshProgress);
    addEventListener("pagehide", () =>
      track("session_ended", {
        seconds: Math.round((performance.now() - startedAt) / 1000),
      }),
    );
  }

  window.OrgIntelAnalytics = {
    track,
    snapshot: analyticsSnapshot,
    setEnabled: setAnalyticsEnabled,
    isEnabled: analyticsEnabled,
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
