import path from 'path';
import { readFile, writeFile } from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// PORT is only needed for the dev/preview server; production builds run
// without it, so default it there instead of throwing.
const isBuild = process.argv.includes('build');
const rawPort = process.env.PORT;

if (!rawPort && !isBuild) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort ?? 5173);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

const STAGE5_MARKER = '<!-- orgintel-stage-5 -->';

function replaceOnce(
  html: string,
  search: string,
  replacement: string,
  label: string,
): string {
  const index = html.indexOf(search);
  if (index === -1) {
    throw new Error(`Stage 5 injection anchor not found: ${label}`);
  }
  return html.slice(0, index) + replacement + html.slice(index + search.length);
}

function transformExperienceHtml(source: string): string {
  if (source.includes(STAGE5_MARKER)) return source;

  let html = source;

  html = replaceOnce(
    html,
    '</head>',
    `  ${STAGE5_MARKER}\n  <link rel="stylesheet" href="./stage5.css" />\n</head>`,
    'head asset link',
  );

  html = replaceOnce(
    html,
    `  // Stage 4 globals — exposed by the station IIFEs below
  let dcUnlocked = false;
  let dcCenterMesh = null;`,
    `  // Stage 4/5 progression — persisted so visitors keep their room access.
  const HQ_PROGRESS_KEY = 'orgintel-hq-progress-v1';
  function readHQProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(HQ_PROGRESS_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (_) { return {}; }
  }
  let hqProgress = readHQProgress();
  function writeHQProgress(patch) {
    hqProgress = { ...hqProgress, ...patch, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(HQ_PROGRESS_KEY, JSON.stringify(hqProgress)); } catch (_) {}
    return hqProgress;
  }
  let dcUnlocked = !!hqProgress.memoryComplete;
  let proofUnlocked = !!hqProgress.proofUnlocked || !!hqProgress.decisionComplete;
  let dcCenterMesh = null;
  let dcOptions = [];
  let dcSatellites = [];
  const dcLessonVisual = { active: false, chosen: 1, connections: 0.2 };`,
    'persistent progression globals',
  );

  html = replaceOnce(
    html,
    `    // Lesson 3: three option holograms — one gets chosen at the end
    const options = ['A', 'B', 'C'].map((letter, i) => {`,
    `    // Stage 5: recognizable launch alternatives, controlled by the visitor.
    const optionNames = ['Launch now', 'Small beta', 'Delay 2 weeks'];
    const options = optionNames.map((labelText, i) => {`,
    'Decision Chamber option names',
  );

  html = replaceOnce(
    html,
    `      const lab = labelSprite('Option ' + letter, '#bcd2e2', 30);`,
    `      const lab = labelSprite(labelText, '#bcd2e2', 30);`,
    'Decision Chamber option label',
  );

  html = replaceOnce(
    html,
    `    const LINKS = ['Context', 'Evidence', 'Alternatives', 'AI recommendation', 'Human approval', 'Outcome'];`,
    `    const LINKS = ['Context', 'Evidence', 'Assumptions', 'Alternatives', 'Owner', 'Expected outcome'];`,
    'Decision Chamber relationship labels',
  );

  html = replaceOnce(
    html,
    `    stations.push({
      name: 'Decision Chamber', pos: [X, Z], base: b, demo: 0, gold: false,`,
    `    dcOptions = options;
    dcSatellites = sats;

    stations.push({
      name: 'Decision Chamber', pos: [X, Z], base: b, demo: 0, gold: false,`,
    'Decision Chamber visual references',
  );

  html = replaceOnce(
    html,
    `      update(dt, t) {
        const d = this.demo;
        if (!REDUCE) center.rotation.y += 0.006 * dt;`,
    `      update(dt, t) {
        const d = dcLessonVisual.active ? dcLessonVisual.connections : this.demo;
        if (!REDUCE) center.rotation.y += 0.006 * dt;`,
    'Decision Chamber lesson-controlled animation',
  );

  html = replaceOnce(
    html,
    `          if (o.i === 1) { // chosen`,
    `          if (o.i === dcLessonVisual.chosen) { // visitor-selected recommendation`,
    'Decision Chamber selected option',
  );

  html = replaceOnce(
    html,
    `      dcUnlocked = true;
      glowDecisionChamber();`,
    `      dcUnlocked = true;
      writeHQProgress({ memoryComplete: true });
      glowDecisionChamber();`,
    'Memory Archive persistence',
  );

  html = replaceOnce(
    html,
    `    // Stage 4: intercept Memory Archive before lesson is complete
    if (s.name === 'Memory Archive' && !dcUnlocked) {
      cardEl.classList.remove('on'); // hide card while lesson is active
      memoryArchiveLesson.show();
    }`,
    `    // Persistent room gates: Memory → Decision → Proof.
    if (s.name === 'Memory Archive' && !dcUnlocked) {
      cardEl.classList.remove('on');
      memoryArchiveLesson.show();
      return;
    }
    if (s.name === 'Decision Chamber') {
      if (!dcUnlocked) {
        cardK.textContent = 'Room two · locked';
        cardTitle.textContent = 'Complete the Memory Archive first.';
        cardBody.textContent = 'Organizational Memory supplies the context and evidence that Decision Intelligence needs.';
        cardClose.style.display = 'grid';
        cardEl.classList.add('on');
        showToast('Decision Chamber locked · complete Room one');
        return;
      }
      if (window.OrgIntelStage5 && typeof window.OrgIntelStage5.open === 'function') {
        cardEl.classList.remove('on');
        window.OrgIntelStage5.open();
        return;
      }
    }
    if (s.name === 'Proof Vault' && !proofUnlocked) {
      cardK.textContent = 'Room three · locked';
      cardTitle.textContent = 'Complete the Decision Chamber first.';
      cardBody.textContent = 'Choose the evidence-based recommendation and pass the Decision Intelligence knowledge check to unlock verifiable proof.';
      cardClose.style.display = 'grid';
      cardEl.classList.add('on');
      showToast('Proof Vault locked · complete Room two');
      return;
    }`,
    'room progression gates',
  );

  html = replaceOnce(
    html,
    `    if (e.target.closest('.card, .pill, .tal, .timebar')) return;`,
    `    if (e.target.closest('.card, .pill, .tal, .timebar, .decision-lesson, .proof-lesson, .observatory-lesson')) return;`,
    'mobile lesson touch isolation',
  );

  html = replaceOnce(
    html,
    `  start(); // world alive behind the lobby`,
    `  function glowProofVault() {
    const proof = stations.find(s => s.name === 'Proof Vault');
    if (!proof || !proof.base || !proof.base.ring) return;
    const started = performance.now();
    const duration = 2600;
    function pulse(now) {
      const p = Math.min(1, (now - started) / duration);
      const wave = Math.sin(p * Math.PI);
      proof.base.ring.material.color.setHex(0xffb454);
      proof.base.ring.material.opacity = 0.62 + wave * 0.38;
      proof.base.ring.scale.setScalar(1 + wave * 0.08);
      if (p < 1) requestAnimationFrame(pulse);
      else proof.base.ring.scale.setScalar(1);
    }
    requestAnimationFrame(pulse);
  }

  window.OrgIntelHQ = {
    getProgress() { return { ...hqProgress }; },
    setDecisionVisual(next) {
      dcLessonVisual.active = !!next.active;
      if (Number.isInteger(next.chosen)) dcLessonVisual.chosen = Math.max(0, Math.min(2, next.chosen));
      if (Number.isFinite(next.connections)) dcLessonVisual.connections = Math.max(0, Math.min(1, next.connections));
      const dc = stations.find(s => s.name === 'Decision Chamber');
      if (dc && dc.base && dc.base.ring) {
        dc.base.ring.material.color.setHex(dcLessonVisual.active ? 0x1fe0c6 : (dcUnlocked ? 0xffb454 : 0x1fe0c6));
        dc.base.ring.material.opacity = dcLessonVisual.active ? 0.95 : 0.6;
      }
      if (dcCenterMesh) {
        dcCenterMesh.material.emissive.setHex(dcLessonVisual.active ? 0x1fe0c6 : (dcUnlocked ? 0xffb454 : 0xe9f1f7));
        dcCenterMesh.material.emissiveIntensity = dcLessonVisual.active ? 2.1 : (dcUnlocked ? 1.6 : 0.8);
      }
      warmFill.color.setHex(dcLessonVisual.active ? 0x1fe0c6 : 0xffb454);
      warmFill.intensity = dcLessonVisual.active ? 40 : 28;
    },
    unlockProof() {
      proofUnlocked = true;
      writeHQProgress({ decisionComplete: true, proofUnlocked: true });
      glowProofVault();
      showToast('Proof Vault unlocked ✦');
    },
    leaveFocus,
    moveTowardStation(name) {
      const station = stations.find(s => s.name === name);
      if (!station) return;
      const dx = station.pos[0] - player.position.x;
      const dz = station.pos[1] - player.position.z;
      const magnitude = Math.hypot(dx, dz) || 1;
      vel.x = (dx / magnitude) * MAX;
      vel.z = (dz / magnitude) * MAX;
      showToast(name + ' is now available');
    },
  };

  if (dcUnlocked) glowDecisionChamber();
  if (proofUnlocked) glowProofVault();

  start(); // world alive behind the lobby`,
    'Stage 5 headquarters API',
  );

  html = replaceOnce(
    html,
    '</body>',
    `  <script src="./stage5.js"></script>\n</body>`,
    'Stage 5 script',
  );

  return html;
}

// Serves the transformed experience in development and patches the copied
// public HTML after production builds. The original 3D headquarters source
// remains intact; Stage 5 is layered in through deterministic, checked anchors.
function experienceStage5Plugin(): Plugin {
  const sourceFile = path.resolve(
    import.meta.dirname,
    'public',
    'experience',
    'index.html',
  );
  const builtFile = path.resolve(
    import.meta.dirname,
    'dist',
    'public',
    'experience',
    'index.html',
  );

  return {
    name: 'orgintel-stage-5-experience',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (
          pathname !== '/experience' &&
          pathname !== '/experience/' &&
          pathname !== '/experience/index.html'
        ) {
          next();
          return;
        }

        try {
          const source = await readFile(sourceFile, 'utf8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(transformExperienceHtml(source));
        } catch (error) {
          next(error as Error);
        }
      });
    },
    async closeBundle() {
      const source = await readFile(builtFile, 'utf8');
      await writeFile(builtFile, transformExperienceHtml(source), 'utf8');
    },
  };
}

export default defineConfig({
  base: basePath,
  // MPA mode disables SPA fallback so /experience/ can use its own document.
  appType: 'mpa',
  plugins: [
    experienceStage5Plugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
