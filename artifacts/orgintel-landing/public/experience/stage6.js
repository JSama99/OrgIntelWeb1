(() => {
  'use strict';

  const KEY = 'orgintel-hq-progress-v1';
  const TOTAL_STEPS = 9;
  const record = {
    decision: 'Release OrgIntel to a small beta group first',
    owner: 'Founder',
    source: 'Decision Chamber',
    approvedAt: '2026-07-18T18:45:00Z',
    version: '1.0',
    betaSize: 12,
    expectedOutcome: 'Validate demand while controlling launch risk',
  };

  let step = 0;
  let fieldsSeen = new Set();
  let sealed = false;
  let fingerprint = '';
  let tampered = false;
  let tamperChecked = false;
  let answerLocked = false;
  let overlay = null;
  let observerGuard = false;

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

  async function sha256(value) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) return '';
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function canonicalRecord(nextRecord = record) {
    return JSON.stringify({
      decision: nextRecord.decision,
      owner: nextRecord.owner,
      source: nextRecord.source,
      approvedAt: nextRecord.approvedAt,
      version: nextRecord.version,
      betaSize: nextRecord.betaSize,
      expectedOutcome: nextRecord.expectedOutcome,
    });
  }

  function shortHash(value) {
    if (!value) return 'not sealed';
    return `${value.slice(0, 12)}…${value.slice(-10)}`;
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'proofLesson';
    overlay.className = 'proof-lesson';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Proof Vault interactive lesson');
    overlay.innerHTML = '<div class="pv-shell" id="pvShell"></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', handleClick);
    return overlay;
  }

  function shell() {
    ensureOverlay();
    return document.getElementById('pvShell');
  }

  function progressWidth() {
    return Math.max(11.1, ((step + 1) / TOTAL_STEPS) * 100);
  }

  function frame(title, body, actions = '') {
    return `
      <button class="pv-close" data-action="close" aria-label="Close Proof Vault lesson">✕</button>
      <span class="pv-room">Room three · Proof Vault · Stage 6</span>
      <div class="pv-head"><h2>${title}</h2><span class="pv-step-count">${step + 1} / ${TOTAL_STEPS}</span></div>
      <div class="pv-progress" aria-hidden="true"><span style="width:${progressWidth()}%"></span></div>
      ${body}
      ${actions}
    `;
  }

  function actions({ back = true, next = true, nextLabel = 'Continue →', disabled = false, extra = '' } = {}) {
    return `<div class="pv-actions">
      ${back ? '<button class="pv-btn" data-action="back">← Back</button>' : ''}
      ${extra}
      ${next ? `<button class="pv-btn primary" data-action="next" ${disabled ? 'disabled' : ''}>${nextLabel}</button>` : ''}
    </div>`;
  }

  function render() {
    let html = '';

    if (step === 0) {
      html = frame('A decision has arrived for sealing.', `
        <div class="pv-eyebrow">From the Decision Chamber</div>
        <div class="pv-record">
          <span class="tag">Approved decision</span>
          <h3>${record.decision}</h3>
          <p>Expected outcome: ${record.expectedOutcome}.</p>
        </div>
        <p class="pv-copy">A saved sentence is only a record. The Proof Vault adds <strong>provenance, integrity, and verification</strong> so someone can later check where the record came from and whether it changed.</p>
      `, actions({ back: false, nextLabel: 'Inspect its provenance →' }));
    } else if (step === 1) {
      const fields = [
        ['Source', record.source, 'Shows which system or workflow produced the record.'],
        ['Creator / owner', record.owner, 'Shows who was accountable when the decision was approved.'],
        ['Timestamp', 'July 18, 2026 · 6:45 PM UTC', 'Shows when this exact version entered the proof process.'],
        ['Version', record.version, 'Separates this sealed version from later revisions.'],
      ];
      const cards = fields.map((item, index) => `
        <button class="pv-field ${fieldsSeen.has(index) ? 'seen' : ''}" data-field="${index}">
          <span class="tag">${fieldsSeen.has(index) ? 'Inspected ✓' : 'Inspect field'}</span>
          <h3>${item[0]}</h3><b>${item[1]}</b><p>${item[2]}</p>
        </button>`).join('');
      html = frame('Proof begins with provenance.', `
        <p class="pv-copy">Inspect every field. Provenance answers: <em>Where did this come from, who was responsible, and which version are we examining?</em></p>
        <div class="pv-field-grid">${cards}</div>
        <p class="pv-feedback ${fieldsSeen.size === 4 ? 'ok' : ''}">${fieldsSeen.size === 4 ? 'Provenance is complete. The record is ready to be compared and sealed.' : `${fieldsSeen.size} of 4 provenance fields inspected.`}</p>
      `, actions({ nextLabel: 'Compare record and proof →', disabled: fieldsSeen.size < 4 }));
    } else if (step === 2) {
      html = frame('A record is not automatically proof.', `
        <div class="pv-compare">
          <div class="pv-compare-card ordinary">
            <span class="tag">Ordinary record</span>
            <ul><li>Can be copied or edited silently</li><li>Origin may be unclear</li><li>Version history may be incomplete</li><li>Trust depends on whoever presents it</li></ul>
          </div>
          <div class="pv-compare-card verified">
            <span class="tag">Verifiable proof record</span>
            <ul><li>Source and owner are attached</li><li>Exact version receives a fingerprint</li><li>Later changes create a mismatch</li><li>Verification can be repeated independently</li></ul>
          </div>
        </div>
        <div class="pv-note"><strong>Important:</strong> verification can show that a record is authentic and unchanged since sealing. It cannot guarantee that the original claim was factually correct.</div>
      `, actions({ nextLabel: 'Seal this version →' }));
    } else if (step === 3) {
      html = frame('Create a fingerprint for this exact record.', `
        <p class="pv-copy">The vault converts the approved record into a SHA-256 fingerprint. Even a tiny later change produces a different fingerprint.</p>
        <div class="pv-seal ${sealed ? 'sealed' : ''}">
          <div class="pv-document"><span>Decision v${record.version}</span><b>${record.decision}</b><small>Beta size: ${record.betaSize}</small></div>
          <div class="pv-arrow">→</div>
          <div class="pv-fingerprint"><span>SHA-256 fingerprint</span><code>${sealed ? shortHash(fingerprint) : 'waiting to seal'}</code></div>
        </div>
        <p class="pv-feedback ${sealed ? 'ok' : ''}" id="pvSealFeedback">${sealed ? 'Sealed. This fingerprint represents the exact content and metadata shown above.' : 'The record has not been sealed yet.'}</p>
      `, actions({
        nextLabel: 'Test tamper detection →',
        disabled: !sealed,
        extra: sealed ? '' : '<button class="pv-btn gold" data-action="seal">Create fingerprint and seal</button>',
      }));
    } else if (step === 4) {
      const changedRecord = { ...record, betaSize: 50 };
      html = frame('Now try to change the sealed record.', `
        <p class="pv-copy">The approved record says the beta group contains <strong>12 founders</strong>. Change it to 50, then run verification.</p>
        <div class="pv-tamper">
          <div class="pv-record-mini ${tampered ? 'changed' : ''}">
            <span class="tag">${tampered ? 'Modified after sealing' : 'Sealed content'}</span>
            <h3>Small beta first</h3>
            <p>Beta size: <strong>${tampered ? changedRecord.betaSize : record.betaSize}</strong></p>
          </div>
          <div class="pv-verify-result ${tamperChecked ? 'mismatch' : ''}">
            <span class="tag">Verification result</span>
            <b>${tamperChecked ? 'Fingerprint mismatch' : 'Waiting for verification'}</b>
            <code>${tamperChecked ? 'The current record no longer matches the sealed fingerprint.' : shortHash(fingerprint)}</code>
          </div>
        </div>
        <p class="pv-feedback ${tamperChecked ? 'warn' : ''}">${tamperChecked ? 'Change detected. The vault does not erase the modified copy—it proves that it is not the version that was originally sealed.' : 'Make a change and verify it.'}</p>
      `, actions({
        nextLabel: 'See the proof chain →',
        disabled: !tamperChecked,
        extra: `${!tampered ? '<button class="pv-btn" data-action="tamper">Change 12 to 50</button>' : ''}${tampered && !tamperChecked ? '<button class="pv-btn gold" data-action="verify">Verify changed record</button>' : ''}`,
      }));
    } else if (step === 5) {
      html = frame('Proof can preserve continuity over time.', `
        <p class="pv-copy">A new proof entry can include the fingerprint of the previous entry. That creates an append-only sequence where missing or rewritten history becomes visible.</p>
        <div class="pv-chain">
          <div class="pv-block"><span>Previous entry</span><b>Beta decision proposed</b><code>prev: 8a61…3d20</code></div>
          <div class="pv-chain-link">linked by fingerprint</div>
          <div class="pv-block current"><span>Current sealed entry</span><b>Small beta approved</b><code>${shortHash(fingerprint)}</code></div>
        </div>
        <div class="pv-note">This does not require exposing private business content publicly. A system can verify existence and integrity while keeping the underlying payload access-controlled.</div>
      `, actions({ nextLabel: 'Understand verification →' }));
    } else if (step === 6) {
      html = frame('What does organizational proof mean?', `
        <div class="pv-definition">Organizational proof is a verifiable record of <strong>what happened, where it came from, who was responsible, when it was sealed, and whether it changed afterward.</strong></div>
        <p class="pv-copy">It turns business activity into evidence that can support audits, client confidence, internal accountability, handoffs, and future learning.</p>
        <p class="pv-copy">The goal is not surveillance. The goal is <em>trust without forcing people to rely on memory or authority alone.</em></p>
      `, actions({ nextLabel: 'Test my understanding →' }));
    } else if (step === 7) {
      html = frame('Quick knowledge check.', `
        <p class="pv-copy"><strong>What can cryptographic verification reliably demonstrate?</strong></p>
        <div class="pv-choices">
          <button class="pv-choice" data-answer="false">That every statement inside the original record was objectively true.</button>
          <button class="pv-choice" data-answer="true">That the checked record matches the version that was sealed, with its source and provenance attached.</button>
          <button class="pv-choice" data-answer="false">That nobody with access has ever read or copied the record.</button>
        </div>
        <p class="pv-feedback" id="pvAnswerFeedback"></p>
      `, actions({ next: false }));
    } else {
      html = frame('The Intelligence Observatory is unlocked.', `
        <div class="pv-complete">
          <span class="star">✦</span>
          <h3>Organizational proof understood.</h3>
          <p>You inspected provenance, sealed an exact version, detected a later change, and learned the limits of verification. The Observatory can now combine memory, decisions, and proof into a living view of the organization.</p>
        </div>
      `, actions({
        back: false,
        next: false,
        extra: '<button class="pv-btn" data-action="replay">Replay lesson</button><button class="pv-btn gold" data-action="observatory">Enter the Observatory →</button>',
      }));
    }

    shell().innerHTML = html;
  }

  function go(nextStep) {
    step = Math.max(0, Math.min(TOTAL_STEPS - 1, nextStep));
    saveProgress({
      proofStep: step,
      proofFieldsSeen: [...fieldsSeen],
      proofSealed: sealed,
      proofFingerprint: fingerprint,
      proofTampered: tampered,
      proofTamperChecked: tamperChecked,
    });
    render();
    const box = shell();
    if (box) box.scrollTop = 0;
  }

  function open() {
    const progress = readProgress();
    if (!progress.proofUnlocked && !progress.decisionComplete) return;

    fieldsSeen = new Set(Array.isArray(progress.proofFieldsSeen) ? progress.proofFieldsSeen : []);
    sealed = !!progress.proofSealed;
    fingerprint = typeof progress.proofFingerprint === 'string' ? progress.proofFingerprint : '';
    tampered = !!progress.proofTampered;
    tamperChecked = !!progress.proofTamperChecked;
    step = progress.proofComplete ? 8 : Math.max(0, Math.min(7, Number(progress.proofStep) || 0));
    answerLocked = false;

    ensureOverlay().classList.add('on');
    document.body.classList.add('stage6-open');
    render();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('on');
    document.body.classList.remove('stage6-open');
    const hq = window.OrgIntelHQ;
    if (hq && hq.leaveFocus) hq.leaveFocus();
  }

  async function sealRecord() {
    const feedback = document.getElementById('pvSealFeedback');
    if (feedback) feedback.textContent = 'Creating SHA-256 fingerprint…';
    fingerprint = await sha256(canonicalRecord());
    if (!fingerprint) {
      if (feedback) feedback.textContent = 'This browser could not run the Web Crypto verification demo.';
      return;
    }
    sealed = true;
    saveProgress({ proofSealed: true, proofFingerprint: fingerprint, proofStep: step });
    render();
  }

  async function verifyTamperedRecord() {
    if (!tampered || !fingerprint) return;
    const changed = { ...record, betaSize: 50 };
    const changedFingerprint = await sha256(canonicalRecord(changed));
    tamperChecked = !!changedFingerprint && changedFingerprint !== fingerprint;
    saveProgress({ proofTampered: true, proofTamperChecked: tamperChecked, proofStep: step });
    render();
  }

  function handleClick(event) {
    const target = event.target.closest('button');
    if (!target) return;

    if (target.dataset.action === 'close') { close(); return; }
    if (target.dataset.action === 'back') { go(step - 1); return; }
    if (target.dataset.action === 'next') { go(step + 1); return; }
    if (target.dataset.action === 'seal') { sealRecord(); return; }
    if (target.dataset.action === 'tamper') {
      tampered = true;
      saveProgress({ proofTampered: true, proofStep: step });
      render();
      return;
    }
    if (target.dataset.action === 'verify') { verifyTamperedRecord(); return; }
    if (target.dataset.action === 'replay') {
      fieldsSeen = new Set();
      sealed = false;
      fingerprint = '';
      tampered = false;
      tamperChecked = false;
      answerLocked = false;
      saveProgress({
        proofComplete: false,
        observatoryUnlocked: false,
        proofStep: 0,
        proofFieldsSeen: [],
        proofSealed: false,
        proofFingerprint: '',
        proofTampered: false,
        proofTamperChecked: false,
      });
      go(0);
      return;
    }
    if (target.dataset.action === 'observatory') {
      close();
      const hq = window.OrgIntelHQ;
      if (hq && hq.moveTowardStation) hq.moveTowardStation('Observatory');
      return;
    }
    if (target.dataset.field !== undefined) {
      fieldsSeen.add(Number(target.dataset.field));
      saveProgress({ proofFieldsSeen: [...fieldsSeen], proofStep: step });
      render();
      return;
    }
    if (target.dataset.answer !== undefined && !answerLocked) {
      const correct = target.dataset.answer === 'true';
      const feedback = document.getElementById('pvAnswerFeedback');
      if (correct) {
        answerLocked = true;
        target.classList.add('correct');
        if (feedback) {
          feedback.textContent = 'Correct. Verification proves a match to the sealed version—it does not prove every original claim was true.';
          feedback.classList.add('ok');
        }
        saveProgress({
          proofComplete: true,
          observatoryUnlocked: true,
          proofStep: 8,
        });
        setTimeout(() => go(8), 950);
      } else {
        target.classList.add('wrong');
        if (feedback) feedback.textContent = 'Not quite. Verification checks provenance and integrity, not the factual truth of every original statement.';
      }
    }
  }

  function rewriteObservatoryLock() {
    const card = document.getElementById('card');
    if (!card) return;
    const progress = readProgress();
    if (progress.observatoryUnlocked || progress.proofComplete) return;
    const title = document.getElementById('cardTitle');
    if (!card.classList.contains('on') || !title || title.textContent !== 'The Intelligence Observatory') return;

    observerGuard = true;
    const k = document.getElementById('cardK');
    const body = document.getElementById('cardBody');
    const closeButton = document.getElementById('cardClose');
    if (k) k.textContent = 'Room four · locked';
    title.textContent = 'Complete the Proof Vault first.';
    if (body) body.textContent = 'The Observatory depends on trusted memory, explainable decisions, and verified proof. Complete Room three to unlock the combined intelligence view.';
    if (closeButton) closeButton.style.display = 'grid';
    queueMicrotask(() => { observerGuard = false; });
  }

  function interceptStationCard() {
    if (observerGuard || (overlay && overlay.classList.contains('on'))) return;
    const card = document.getElementById('card');
    const title = document.getElementById('cardTitle');
    if (!card || !title || !card.classList.contains('on')) return;

    if (title.textContent === 'The Proof Vault') {
      const progress = readProgress();
      if (!progress.proofUnlocked && !progress.decisionComplete) return;
      observerGuard = true;
      card.classList.remove('on');
      queueMicrotask(() => { observerGuard = false; open(); });
      return;
    }

    if (title.textContent === 'The Intelligence Observatory') {
      rewriteObservatoryLock();
    }
  }

  function bootObserver() {
    const card = document.getElementById('card');
    if (!card) {
      setTimeout(bootObserver, 100);
      return;
    }
    const observer = new MutationObserver(() => queueMicrotask(interceptStationCard));
    observer.observe(card, { attributes: true, childList: true, subtree: true, characterData: true });
    interceptStationCard();
  }

  function loadStage7Assets() {
    if (!document.querySelector('link[data-orgintel-stage7]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = './stage7.css';
      stylesheet.dataset.orgintelStage7 = 'true';
      document.head.appendChild(stylesheet);
    }
    if (!document.querySelector('script[data-orgintel-stage7]')) {
      const script = document.createElement('script');
      script.src = './stage7.js';
      script.dataset.orgintelStage7 = 'true';
      document.body.appendChild(script);
    }
  }

  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay && overlay.classList.contains('on')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }
  }, true);

  window.OrgIntelStage6 = { open, close };
  bootObserver();
  loadStage7Assets();
})();
