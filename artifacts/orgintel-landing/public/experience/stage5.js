(() => {
  'use strict';

  const KEY = 'orgintel-hq-progress-v1';
  const TOTAL_STEPS = 8;
  let step = 0;
  let selected = 1;
  let evidenceSeen = new Set();
  let answerLocked = false;
  let overlay = null;

  const scenario = {
    question: 'Should we launch publicly now, delay two weeks, or release to a small beta group first?',
    options: [
      {
        title: 'Launch publicly now',
        benefit: 'Fastest path to market and revenue.',
        risk: 'High reputation risk while onboarding and support are unfinished.',
      },
      {
        title: 'Release to a small beta first',
        benefit: 'Real customer learning with controlled exposure.',
        risk: 'Public launch moves back about one week.',
        recommended: true,
      },
      {
        title: 'Delay the full launch two weeks',
        benefit: 'More time to polish onboarding and fix defects.',
        risk: 'No customer learning during the delay; momentum may fade.',
      },
    ],
  };

  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (_) {
      return {};
    }
  }

  function saveProgress(patch) {
    const next = { ...readProgress(), ...patch, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'decisionLesson';
    overlay.className = 'decision-lesson';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Decision Chamber interactive lesson');
    overlay.innerHTML = '<div class="dc-shell" id="dcShell"></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', handleClick);
    return overlay;
  }

  function shell() {
    ensureOverlay();
    return document.getElementById('dcShell');
  }

  function progressWidth() {
    return Math.max(12.5, ((step + 1) / TOTAL_STEPS) * 100);
  }

  function frame(title, body, actions = '') {
    return `
      <button class="dc-close" data-action="close" aria-label="Close Decision Chamber lesson">✕</button>
      <span class="dc-room">Room two · Decision Chamber · Stage 5</span>
      <div class="dc-head"><h2>${title}</h2><span class="dc-step-count">${step + 1} / ${TOTAL_STEPS}</span></div>
      <div class="dc-progress" aria-hidden="true"><span style="width:${progressWidth()}%"></span></div>
      ${body}
      ${actions}
    `;
  }

  function actions({ back = true, next = true, nextLabel = 'Continue →', disabled = false, extra = '' } = {}) {
    return `<div class="dc-actions">
      ${back ? '<button class="dc-btn" data-action="back">← Back</button>' : ''}
      ${extra}
      ${next ? `<button class="dc-btn primary" data-action="next" ${disabled ? 'disabled' : ''}>${nextLabel}</button>` : ''}
    </div>`;
  }

  function render() {
    const hq = window.OrgIntelHQ;
    const visualLevels = [0.20, 0.30, 0.54, 0.72, 1, 1, 1, 1];
    if (hq && hq.setDecisionVisual) {
      hq.setDecisionVisual({ active: true, chosen: selected, connections: visualLevels[step] || 0.2 });
    }

    let html = '';
    if (step === 0) {
      html = frame('A launch decision is in progress.', `
        <div class="dc-eyebrow">Solo-founder scenario</div>
        <p class="dc-copy">A normal decision starts with a choice. <strong>Decision Intelligence starts by making the decision understandable.</strong></p>
        <div class="dc-question">${scenario.question}</div>
        <p class="dc-copy">You will review the context, inspect the evidence, compare tradeoffs, and connect the final recommendation to the people and outcomes it affects.</p>
      `, actions({ back: false, nextLabel: 'Review the context →' }));
    } else if (step === 1) {
      html = frame('First, understand the context.', `
        <p class="dc-copy">Context defines what the decision is trying to accomplish and which constraints matter. Without it, evidence can be interpreted in the wrong way.</p>
        <div class="dc-meta-grid">
          <div class="dc-meta"><span>Goal</span><b>Validate demand without damaging customer trust.</b></div>
          <div class="dc-meta"><span>Deadline</span><b>Make a launch decision within 48 hours.</b></div>
          <div class="dc-meta"><span>Owner</span><b>The founder is accountable for the decision.</b></div>
          <div class="dc-meta"><span>Key assumption</span><b>Early adopters will accept rough edges if support is responsive.</b></div>
        </div>
      `, actions({ nextLabel: 'Inspect the evidence →' }));
    } else if (step === 2) {
      const evidence = [
        ['Customer signal', '12 founders volunteered for early access.', 'This proves interest, but not readiness for a broad public launch.'],
        ['Product readiness', 'Onboarding is about 80% complete and three critical issues remain.', 'A full launch carries avoidable support and reputation risk.'],
        ['Business constraint', 'The company has limited support capacity during launch week.', 'A smaller group can be served well while the process is improved.'],
      ];
      const cards = evidence.map((item, index) => `
        <button class="dc-evidence ${evidenceSeen.has(index) ? 'seen' : ''}" data-evidence="${index}">
          <span class="tag">${evidenceSeen.has(index) ? 'Evidence inspected ✓' : 'Inspect evidence'}</span>
          <h3>${item[0]}</h3><p>${item[1]}</p><p class="reveal">${item[2]}</p>
        </button>`).join('');
      html = frame('Inspect the supporting evidence.', `
        <p class="dc-copy">Click each evidence card. Decision Intelligence does not hide the facts that support—or weaken—a recommendation.</p>
        <div class="dc-evidence-grid">${cards}</div>
        <p class="dc-feedback ${evidenceSeen.size === 3 ? 'ok' : ''}">${evidenceSeen.size === 3 ? 'All evidence inspected. You can now compare the alternatives.' : `${evidenceSeen.size} of 3 evidence items inspected.`}</p>
      `, actions({ nextLabel: 'Compare alternatives →', disabled: evidenceSeen.size < 3 }));
    } else if (step === 3) {
      const cards = scenario.options.map((option, index) => `
        <button class="dc-option ${option.recommended ? 'recommended' : ''} ${selected === index ? 'selected' : ''}" data-option="${index}">
          <span class="tag">${option.recommended ? 'Evidence-based recommendation' : 'Alternative'}</span>
          <h3>${option.title}</h3>
          <p>${option.benefit}</p>
          <p class="risk"><strong>Risk / tradeoff:</strong> ${option.risk}</p>
        </button>`).join('');
      const feedback = selected === 1
        ? 'Recommended: use a small beta first. It balances learning, speed, and controlled risk.'
        : 'Compare the evidence again. The strongest recommendation controls exposure while generating real customer learning.';
      html = frame('Compare three alternatives.', `
        <p class="dc-copy">A useful decision record preserves rejected options too. That prevents the organization from repeating the same debate later.</p>
        <div class="dc-option-grid">${cards}</div>
        <p class="dc-feedback ${selected === 1 ? 'ok' : ''}">${feedback}</p>
      `, actions({ nextLabel: 'Connect the recommendation →', disabled: selected !== 1 }));
    } else if (step === 4) {
      html = frame('The recommendation becomes organizational knowledge.', `
        <p class="dc-copy">The choice is no longer an isolated sentence. It is connected to everything needed to understand and evaluate it later.</p>
        <div class="dc-map" aria-label="Decision connected to context, evidence, assumptions, owner, and expected outcome">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="50" y1="50" x2="16" y2="23"/><line x1="50" y1="50" x2="84" y2="23"/>
            <line x1="50" y1="50" x2="16" y2="77"/><line x1="50" y1="50" x2="84" y2="77"/>
            <line x1="50" y1="50" x2="50" y2="12"/>
          </svg>
          <div class="dc-hub">Small beta first<br><small>Recommended decision</small></div>
          <div class="dc-node n1">Evidence<br>12 beta volunteers</div>
          <div class="dc-node n2">Assumption<br>Early adopters accept rough edges</div>
          <div class="dc-node n3">Owner<br>Founder</div>
          <div class="dc-node n4">Expected outcome<br>Validated demand + safer launch</div>
          <div class="dc-node n5">Context<br>Learn fast without harming trust</div>
        </div>
        <div class="dc-compare">
          <div class="dc-compare-card ordinary"><span class="tag">Ordinary decision-making</span><ul><li>Choice recorded alone</li><li>Reasons live in someone’s head</li><li>Rejected options disappear</li><li>Outcome rarely revisited</li></ul></div>
          <div class="dc-compare-card intelligent"><span class="tag">Decision Intelligence</span><ul><li>Context and evidence preserved</li><li>Assumptions are visible</li><li>Owner and expected outcome defined</li><li>Future results can improve the next decision</li></ul></div>
        </div>
      `, actions({ nextLabel: 'What does this mean? →' }));
    } else if (step === 5) {
      html = frame('Decision Intelligence preserves the “why.”', `
        <div class="dc-question">Decision Intelligence is the practice of making choices with visible context, evidence, alternatives, assumptions, accountability, and expected outcomes.</div>
        <p class="dc-copy">It does not guarantee that every decision will be correct. It makes decisions <em>explainable, reviewable, and improvable</em>. When the outcome arrives, the organization can compare what happened with what it expected—and learn.</p>
      `, actions({ nextLabel: 'Test my understanding →' }));
    } else if (step === 6) {
      html = frame('Quick knowledge check.', `
        <p class="dc-copy"><strong>What makes a business decision an example of Decision Intelligence?</strong></p>
        <div class="dc-choices">
          <button class="dc-choice" data-answer="false">The founder makes the decision quickly and announces it to everyone.</button>
          <button class="dc-choice" data-answer="true">The choice is connected to context, evidence, alternatives, assumptions, an owner, and an expected outcome.</button>
          <button class="dc-choice" data-answer="false">An AI system makes the final choice without human accountability.</button>
        </div>
        <p class="dc-feedback" id="dcAnswerFeedback"></p>
      `, actions({ next: false }));
    } else {
      html = frame('The Proof Vault is unlocked.', `
        <div class="dc-complete">
          <span class="star">✦</span>
          <h3>Decision Intelligence understood.</h3>
          <p>You connected a recommendation to its evidence, assumptions, owner, and expected outcome. The next room will show how that decision becomes verifiable proof.</p>
        </div>
      `, actions({ back: false, next: false, extra: '<button class="dc-btn" data-action="replay">Replay lesson</button><button class="dc-btn gold" data-action="proof">Enter the Proof Vault →</button>' }));
    }

    shell().innerHTML = html;
  }

  function go(nextStep) {
    step = Math.max(0, Math.min(TOTAL_STEPS - 1, nextStep));
    saveProgress({ decisionStep: step, decisionSelected: selected, decisionEvidenceSeen: [...evidenceSeen] });
    render();
    const box = shell();
    if (box) box.scrollTop = 0;
  }

  function open() {
    const p = readProgress();
    selected = Number.isInteger(p.decisionSelected) ? p.decisionSelected : 1;
    evidenceSeen = new Set(Array.isArray(p.decisionEvidenceSeen) ? p.decisionEvidenceSeen : []);
    step = p.decisionComplete ? 7 : Math.max(0, Math.min(6, Number(p.decisionStep) || 0));
    answerLocked = false;
    ensureOverlay().classList.add('on');
    document.body.classList.add('stage5-open');
    render();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('on');
    document.body.classList.remove('stage5-open');
    const hq = window.OrgIntelHQ;
    if (hq && hq.setDecisionVisual) hq.setDecisionVisual({ active: false, chosen: selected, connections: 1 });
    if (hq && hq.leaveFocus) hq.leaveFocus();
  }

  function handleClick(event) {
    const target = event.target.closest('button');
    if (!target) return;

    if (target.dataset.action === 'close') { close(); return; }
    if (target.dataset.action === 'back') { go(step - 1); return; }
    if (target.dataset.action === 'next') { go(step + 1); return; }
    if (target.dataset.action === 'replay') {
      selected = 1; evidenceSeen = new Set(); answerLocked = false;
      saveProgress({ decisionComplete: false, decisionStep: 0, decisionSelected: 1, decisionEvidenceSeen: [] });
      go(0); return;
    }
    if (target.dataset.action === 'proof') {
      close();
      const hq = window.OrgIntelHQ;
      if (hq && hq.moveTowardStation) hq.moveTowardStation('Proof Vault');
      return;
    }
    if (target.dataset.evidence !== undefined) {
      evidenceSeen.add(Number(target.dataset.evidence));
      saveProgress({ decisionEvidenceSeen: [...evidenceSeen], decisionStep: step });
      render(); return;
    }
    if (target.dataset.option !== undefined) {
      selected = Number(target.dataset.option);
      saveProgress({ decisionSelected: selected, decisionStep: step });
      render(); return;
    }
    if (target.dataset.answer !== undefined && !answerLocked) {
      const correct = target.dataset.answer === 'true';
      const feedback = document.getElementById('dcAnswerFeedback');
      if (correct) {
        answerLocked = true;
        target.classList.add('correct');
        if (feedback) { feedback.textContent = 'Correct. The preserved connections make the decision explainable and teachable.'; feedback.classList.add('ok'); }
        const hq = window.OrgIntelHQ;
        if (hq && hq.unlockProof) hq.unlockProof();
        saveProgress({ decisionComplete: true, proofUnlocked: true, decisionStep: 7, decisionSelected: selected });
        setTimeout(() => go(7), 900);
      } else {
        target.classList.add('wrong');
        if (feedback) feedback.textContent = 'Not quite. Speed or automation alone does not preserve the reasoning behind a decision.';
      }
    }
  }

  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay && overlay.classList.contains('on')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  }, true);

  window.OrgIntelStage5 = { open, close };
})();
