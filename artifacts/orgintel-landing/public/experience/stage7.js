(() => {
  "use strict";

  const KEY = "orgintel-hq-progress-v1";
  const TOTAL_STEPS = 11;
  const nodeData = [
    ["Founder", "Person", 14, 28],
    ["Research Agent", "AI agent", 39, 17],
    ["Beta Launch", "Project", 53, 46],
    ["Beta Decision", "Decision", 77, 20],
    ["Interview Notes", "Artifact", 22, 67],
    ["Sealed Approval", "Proof", 82, 70],
  ];
  const links = [
    [0, 2],
    [1, 2],
    [4, 2],
    [3, 2],
    [3, 5],
    [2, 5],
    [0, 4],
  ];
  const causes = [
    ["Founder approval queue", "person", 18, 24],
    ["Research agent retrying", "agent", 50, 18],
    ["Missing interview notes", "artifact", 18, 75],
    ["Beta decision blocked", "decision", 79, 73],
  ];

  let step = 0;
  let overlay = null;
  let nodesSeen = new Set();
  let causesSeen = new Set();
  let actionChoice = "";
  let answerLocked = false;
  let observerGuard = false;

  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (_) {
      return {};
    }
  }
  function saveProgress(patch) {
    const next = {
      ...readProgress(),
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (_) {}
    return next;
  }
  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "observatoryLesson";
    overlay.className = "observatory-lesson";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute(
      "aria-label",
      "Intelligence Observatory interactive lesson",
    );
    overlay.innerHTML = '<div class="io-shell" id="ioShell"></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", handleClick);
    return overlay;
  }
  function shell() {
    ensureOverlay();
    return document.getElementById("ioShell");
  }
  function actions({
    back = true,
    next = true,
    nextLabel = "Continue →",
    disabled = false,
    extra = "",
  } = {}) {
    return `<div class="io-actions">${back ? '<button class="io-btn" data-action="back">← Back</button>' : ""}${extra}${next ? `<button class="io-btn primary" data-action="next" ${disabled ? "disabled" : ""}>${nextLabel}</button>` : ""}</div>`;
  }
  function frame(title, body, actionBar = "") {
    return `<button class="io-close" data-action="close" aria-label="Close Intelligence Observatory lesson">✕</button>
      <span class="io-room">Room four · Intelligence Observatory · Stage 7</span>
      <div class="io-head"><h2>${title}</h2><span class="io-step-count">${step + 1} / ${TOTAL_STEPS}</span></div>
      <div class="io-progress" aria-hidden="true"><span style="width:${((step + 1) / TOTAL_STEPS) * 100}%"></span></div>${body}${actionBar}`;
  }
  function line(a, b, warning = false) {
    const x1 = a[2],
      y1 = a[3],
      x2 = b[2],
      y2 = b[3];
    const dx = x2 - x1,
      dy = y2 - y1;
    return `<span class="io-line ${warning ? "warning" : ""}" style="left:${x1}%;top:${y1}%;width:${Math.hypot(dx, dy)}%;transform:rotate(${Math.atan2(dy, dx)}rad)"></span>`;
  }
  function constellation(inspectable = false) {
    const lines = links
      .map(([a, b]) => line(nodeData[a], nodeData[b]))
      .join("");
    const nodes = nodeData
      .map(
        (n, i) =>
          `<button class="io-node ${inspectable ? "inspectable" : ""} ${nodesSeen.has(i) ? "seen" : ""}" style="left:${n[2]}%;top:${n[3]}%" data-node="${i}" ${inspectable ? "" : "disabled"}>${n[0]}<small>${n[1]}</small></button>`,
      )
      .join("");
    return `<div class="io-map" aria-label="Connected organization constellation">${lines}${nodes}</div>`;
  }
  function bottleneckMap(trace = false) {
    const center = ["Review queue", "Bottleneck", 50, 49];
    const causeLines = causes.map((c) => line(c, center, true)).join("");
    const causeNodes = causes
      .map(
        (c, i) =>
          `<button class="io-node cause ${causesSeen.has(i) ? "revealed" : ""}" style="left:${c[2]}%;top:${c[3]}%" data-cause="${i}" ${trace ? "" : "disabled"}>${c[0]}<small>${c[1]}</small></button>`,
      )
      .join("");
    return `<div class="io-map">${causeLines}${causeNodes}<button class="io-node bottleneck" style="left:50%;top:49%" data-bottleneck="true">Review queue<small>orange bottleneck</small></button></div>`;
  }

  function render() {
    let html = "";
    if (step === 0) {
      html = frame(
        "Welcome to the organization’s living view.",
        `<p class="io-copy">The rooms behind you preserved memory, made a decision explainable, and sealed proof. The Observatory connects those capabilities so the organization can <strong>see how work affects other work.</strong></p><div class="io-note">This lesson uses a small beta launch as its example. You will inspect the organization, find a bottleneck, trace its causes, and choose a response.</div>`,
        actions({ back: false, nextLabel: "View the constellation →" }),
      );
    } else if (step === 1) {
      html = frame(
        "The organization is a connected constellation.",
        `${constellation(false)}<p class="io-copy">Each node is useful by itself. The intelligence appears when the system preserves the <em>relationships</em> among people, projects, agents, decisions, artifacts, and proof.</p>`,
        actions({ nextLabel: "Inspect the organization →" }),
      );
    } else if (step === 2) {
      html = frame(
        "Inspect every kind of organizational object.",
        `<p class="io-copy">Select all six nodes. Notice that no single object tells the whole story.</p>${constellation(true)}<p class="io-status ${nodesSeen.size === 6 ? "ok" : ""}">${nodesSeen.size === 6 ? "All six object types inspected. Together they form operational context." : `${nodesSeen.size} of 6 objects inspected.`}</p>`,
        actions({
          disabled: nodesSeen.size < 6,
          nextLabel: "Find the bottleneck →",
        }),
      );
    } else if (step === 3) {
      html = frame(
        "Something in the constellation needs attention.",
        `${bottleneckMap(false)}<p class="io-copy">The orange node shows work accumulating in a shared review queue. Ordinary reporting might show that tasks are late. Organizational Intelligence asks what the delay is connected to.</p>`,
        actions({ nextLabel: "Trace connected causes →" }),
      );
    } else if (step === 4) {
      html = frame(
        "Trace the bottleneck to its connected causes.",
        `<p class="io-copy">Select each connected cause. The bottleneck is not one isolated number; it is the visible effect of several relationships.</p>${bottleneckMap(true)}<p class="io-status ${causesSeen.size === 4 ? "ok" : "warn"}">${causesSeen.size === 4 ? "Cause chain complete: approval concentration, an agent retry loop, missing evidence, and a blocked decision reinforce one another." : `${causesSeen.size} of 4 connected causes traced.`}</p>`,
        actions({
          disabled: causesSeen.size < 4,
          nextLabel: "Compare reporting views →",
        }),
      );
    } else if (step === 5) {
      html = frame(
        "Reporting tells you what happened. Intelligence shows why.",
        `<div class="io-compare"><div class="io-panel"><span>Ordinary reporting</span><h3>“14 tasks are overdue.”</h3><ul><li>Counts isolated events</li><li>Describes a past condition</li><li>Leaves diagnosis to the viewer</li></ul></div><div class="io-panel intel"><span>Organizational Intelligence</span><h3>“One review queue is blocking the beta launch.”</h3><ul><li>Connects tasks to owners and decisions</li><li>Traces missing evidence and agent retries</li><li>Reveals where intervention changes the system</li></ul></div></div>`,
        actions({ nextLabel: "See the emerging pattern →" }),
      );
    } else if (step === 6) {
      html = frame(
        "Patterns emerge from relationships, not isolated metrics.",
        `<div class="io-pattern"><div><b>Repeated dependency</b><p>Four workflows depend on one founder’s approval.</p></div><div><b>Compounding delay</b><p>Missing notes cause the research agent to retry and the decision to wait.</p></div><div><b>Emerging risk</b><p>The launch schedule is now exposed to a single review queue.</p></div></div><div class="io-definition">A metric says the queue is slow. A relationship pattern shows that approval design, missing evidence, and automated retries are producing the delay together.</div>`,
        actions({ nextLabel: "Choose an organizational action →" }),
      );
    } else if (step === 7) {
      html = frame(
        "What should the organization do next?",
        `<p class="io-copy">Choose the action that addresses the connected system, not only the visible symptom.</p><div class="io-choices"><button class="io-choice ${actionChoice === "notify" ? "selected" : ""}" data-action-choice="notify">Send more overdue notifications to everyone.</button><button class="io-choice ${actionChoice === "delegate" ? "selected" : ""}" data-action-choice="delegate">Delegate low-risk approvals, require interview notes before review, and stop the agent retry loop when evidence is missing.</button><button class="io-choice ${actionChoice === "hire" ? "selected" : ""}" data-action-choice="hire">Hire another person before investigating the workflow.</button></div><p class="io-status ${actionChoice === "delegate" ? "ok" : actionChoice ? "warn" : ""}">${actionChoice === "delegate" ? "Strong response: it removes the single approval dependency and repairs the upstream evidence flow." : actionChoice ? "That may treat a symptom, but it does not change the connected causes. Try the system-level response." : "Select an action to continue."}</p>`,
        actions({
          disabled: actionChoice !== "delegate",
          nextLabel: "Explain Organizational Intelligence →",
        }),
      );
    } else if (step === 8) {
      html = frame(
        "What is Organizational Intelligence?",
        `<div class="io-definition">Organizational Intelligence is a company’s ability to connect what it knows, how it decides, what it does, and what it can prove—so people and AI agents can see patterns, understand consequences, and act with context.</div><p class="io-copy">It is not simply a dashboard, search box, or collection of AI summaries. It is a living organizational model built from <em>memory, decisions, relationships, and proof.</em></p>`,
        actions({ nextLabel: "Take the knowledge check →" }),
      );
    } else if (step === 9) {
      html = frame(
        "Quick knowledge check.",
        `<p class="io-copy"><strong>Why could the Observatory identify the true bottleneck?</strong></p><div class="io-choices"><button class="io-choice" data-answer="false">It displayed more isolated metrics on one screen.</button><button class="io-choice" data-answer="true">It connected the delayed work to people, agents, evidence, decisions, and proof.</button><button class="io-choice" data-answer="false">It automatically replaced the founder’s judgment.</button></div><p class="io-status" id="ioAnswerFeedback"></p>`,
        actions({ next: false }),
      );
    } else {
      html = frame(
        "The final operational console is unlocked.",
        `<div class="io-complete"><span class="star">✦</span><h3>Organizational Intelligence understood.</h3><p>You viewed the organization as a constellation, inspected its core objects, traced a bottleneck through connected causes, distinguished reporting from intelligence, chose a system-level action, and passed the knowledge check.</p></div>`,
        actions({
          back: false,
          next: false,
          extra:
            '<button class="io-btn" data-action="replay">Replay lesson</button><button class="io-btn gold" data-action="console">Open final console →</button>',
        }),
      );
    }
    shell().innerHTML = html;
  }
  function go(nextStep) {
    step = Math.max(0, Math.min(TOTAL_STEPS - 1, nextStep));
    saveProgress({
      observatoryStep: step,
      observatoryNodesSeen: [...nodesSeen],
      observatoryCausesSeen: [...causesSeen],
      observatoryAction: actionChoice,
    });
    render();
    const box = shell();
    if (box) box.scrollTop = 0;
  }
  function open() {
    const progress = readProgress();
    if (!progress.observatoryUnlocked && !progress.proofComplete) return;
    nodesSeen = new Set(
      Array.isArray(progress.observatoryNodesSeen)
        ? progress.observatoryNodesSeen
        : [],
    );
    causesSeen = new Set(
      Array.isArray(progress.observatoryCausesSeen)
        ? progress.observatoryCausesSeen
        : [],
    );
    actionChoice =
      typeof progress.observatoryAction === "string"
        ? progress.observatoryAction
        : "";
    step = progress.observatoryComplete
      ? 10
      : Math.max(0, Math.min(9, Number(progress.observatoryStep) || 0));
    answerLocked = false;
    ensureOverlay().classList.add("on");
    document.body.classList.add("stage7-open");
    render();
  }
  function close() {
    if (!overlay) return;
    overlay.classList.remove("on");
    document.body.classList.remove("stage7-open");
    const hq = window.OrgIntelHQ;
    if (hq && hq.leaveFocus) hq.leaveFocus();
  }
  function handleClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.action === "close") {
      close();
      return;
    }
    if (target.dataset.action === "back") {
      go(step - 1);
      return;
    }
    if (target.dataset.action === "next") {
      go(step + 1);
      return;
    }
    if (target.dataset.node !== undefined) {
      nodesSeen.add(Number(target.dataset.node));
      saveProgress({ observatoryNodesSeen: [...nodesSeen] });
      render();
      return;
    }
    if (target.dataset.cause !== undefined) {
      causesSeen.add(Number(target.dataset.cause));
      saveProgress({ observatoryCausesSeen: [...causesSeen] });
      render();
      return;
    }
    if (target.dataset.actionChoice !== undefined) {
      actionChoice = target.dataset.actionChoice;
      saveProgress({ observatoryAction: actionChoice });
      render();
      return;
    }
    if (target.dataset.answer !== undefined && !answerLocked) {
      const correct = target.dataset.answer === "true";
      const feedback = document.getElementById("ioAnswerFeedback");
      if (correct) {
        answerLocked = true;
        target.classList.add("correct");
        if (feedback) {
          feedback.textContent =
            "Correct. Relationships turned a delay metric into an explainable organizational pattern.";
          feedback.classList.add("ok");
        }
        saveProgress({
          observatoryComplete: true,
          consoleUnlocked: true,
          observatoryStep: 10,
        });
        setTimeout(() => go(10), 950);
      } else {
        target.classList.add("wrong");
        if (feedback) {
          feedback.textContent =
            "Not quite. The key was connecting the metric to the organizational objects that caused it.";
          feedback.classList.add("warn");
        }
      }
      return;
    }
    if (target.dataset.action === "replay") {
      nodesSeen = new Set();
      causesSeen = new Set();
      actionChoice = "";
      answerLocked = false;
      saveProgress({
        observatoryComplete: false,
        consoleUnlocked: false,
        observatoryStep: 0,
        observatoryNodesSeen: [],
        observatoryCausesSeen: [],
        observatoryAction: "",
      });
      go(0);
      return;
    }
    if (target.dataset.action === "console") {
      close();
      const hq = window.OrgIntelHQ;
      if (hq && hq.moveTowardStation) hq.moveTowardStation("The Console");
    }
  }
  function interceptStationCard() {
    if (observerGuard || (overlay && overlay.classList.contains("on"))) return;
    const card = document.getElementById("card"),
      title = document.getElementById("cardTitle");
    if (!card || !title || !card.classList.contains("on")) return;
    if (title.textContent === "The Intelligence Observatory") {
      const progress = readProgress();
      if (!progress.observatoryUnlocked && !progress.proofComplete) return;
      observerGuard = true;
      card.classList.remove("on");
      queueMicrotask(() => {
        observerGuard = false;
        open();
      });
      return;
    }
    if (
      title.textContent === "Build an organization that remembers." ||
      title.textContent === "The Operational Console" ||
      title.textContent === "Your organization, understood." ||
      title.textContent === "The Console"
    ) {
      const progress = readProgress();
      if (progress.consoleUnlocked || progress.observatoryComplete) return;
      observerGuard = true;
      const k = document.getElementById("cardK"),
        body = document.getElementById("cardBody"),
        closeButton = document.getElementById("cardClose");
      // Preserve the existing guided tour; gate only free-roam console access.
      if (closeButton && closeButton.style.display === "none") {
        observerGuard = false;
        return;
      }
      const cta = document.getElementById("cardCta"),
        ghost = document.getElementById("cardGhost"),
        next = document.getElementById("cardNext");
      if (k) k.textContent = "Final area · locked";
      title.textContent = "Complete the Intelligence Observatory first.";
      if (body)
        body.textContent =
          "The operational console unlocks after you trace the organization’s relationships, identify the bottleneck, choose an action, and pass the knowledge check.";
      if (closeButton) closeButton.style.display = "grid";
      if (cta) cta.style.display = "none";
      if (ghost) ghost.style.display = "none";
      if (next) next.style.display = "none";
      queueMicrotask(() => {
        observerGuard = false;
      });
    }
  }
  function bootObserver() {
    const card = document.getElementById("card");
    if (!card) {
      setTimeout(bootObserver, 100);
      return;
    }
    const observer = new MutationObserver(() =>
      queueMicrotask(interceptStationCard),
    );
    observer.observe(card, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
    interceptStationCard();
  }
  addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        overlay &&
        overlay.classList.contains("on")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
      }
    },
    true,
  );
  window.OrgIntelStage7 = { open, close };
  bootObserver();
})();
