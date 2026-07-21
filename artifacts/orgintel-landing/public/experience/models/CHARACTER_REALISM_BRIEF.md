# Character Realism Brief — Pass C1

Pass C1 creates the reversible review foundation for upgraded Hero and Tal character assets in the OrgIntel 3D Intelligence Headquarters. It is a text-only runtime and specification pass: do not create, modify, rename, or delete GLB, PNG, KTX2, or other binary assets in this phase.

## Current production runtime inventory

Runtime file: `artifacts/orgintel-landing/public/experience/index.html`.

- Current Hero/Founder production GLB path: `./models/founder.glb`.
- Current Tal production GLB path: `./models/tal.glb`.
- Reserved Hero review GLB path: `./models/orgintel-hero-character-review.glb`.
- Reserved Tal review GLB path: `./models/orgintel-tal-character-review.glb`.
- Loader foundation: a shared `THREE.GLTFLoader` loads the atrium fallback chain, the Hero/Foundation character, Tal, and the Intelligence Core.
- Character loader behavior: `loadCharacterAsset()` chooses production or review candidates from query parameters, adds only the first successful candidate for each character, and records one loading-progress completion per character.
- Hero scene anchor: `player`, positioned at `(0, 0, 28)`.
- Hero loaded-model transform: child of `player`, local position `(0, 0, 0)`, scale `1.0`, rotation Y `Math.PI`.
- Tal scene anchor: `tal`, positioned at `(3.5, 0, 22)` during startup and then moved by guided-tour or free-roam follow logic.
- Tal loaded-model transform: child of `tal`, local position `(0, 0, 0)`, scale `1.12`, rotation Y `Math.PI`.
- Material tuning: `prepareLoadedModel()` enables shadows by quality tier, sets `receiveShadow = true`, and supplies default roughness `.48` and metalness `.12` only when those material properties are undefined.
- Animation handling: no GLB animation mixers are currently wired for Hero or Tal. Runtime idle motion is procedural: Hero bobbing on the loaded model, Tal bobbing plus slight Z rotation, and Tal anchor movement during tour/free roam. Reduced-motion disables these procedural idle updates.
- Interaction dependencies: player movement, camera follow, guided tour, room gates, station interactions, and distance checks depend on the `player` anchor. Tal guide movement and teaching UI depend on the `tal` anchor and the existing Tal dialogue system.
- LOD or quality-tier behavior: character GLBs do not currently have dedicated LOD switching. Runtime quality affects renderer pixel ratio, shadows, bloom, and atrium LOD/contact-depth behavior.
- Loading progress accounting: there are four top-level asset attempts: atrium, Hero, Tal, and Intelligence Core. Each character must call `assetFinished()` exactly once after either a successful production/review load or complete character-GLB failure.
- Current fallback behavior: if a production character GLB fails, the procedural Hero or Tal model remains visible and the loading UI reports partial production assets with fallbacks active. Pass C1 preserves that behavior after all GLB candidates for a character fail.

## Query-controlled review switches

- `?characters=review` requests both review characters.
- `?hero=review` requests only the upgraded Hero.
- `?tal=review` requests only upgraded Tal.
- Default production visits continue to load the current validated production characters.
- Each review character falls back independently to its current production counterpart.
- Hero review failure must not prevent Tal from loading.
- Tal review failure must not prevent Hero from loading.
- Never add both the review and production version of the same character.
- Preserve loading progress and completion accounting.
- Optional diagnostics in `?perf=1` report Hero and Tal state as `production`, `review`, `production fallback`, or procedural/unavailable fallback states. These rows remain hidden during normal visits because the performance panel is hidden unless `?perf=1` is present.

## Hero visual target

- Believable humanoid silhouette and proportions.
- Recognizable head, face, hair, hands, footwear, and layered clothing.
- Black, cyan, and restrained gold OrgIntel architect/founder wardrobe.
- PBR skin, cloth, leather, and metallic materials.
- Subtle idle breathing, blinking, head movement, and console interaction.
- Controlled rim lighting and contact shadows.
- Reduced surrounding glow so the character reads as a grounded person rather than a silhouette inside an emissive aura.
- High, medium, and low LOD targets that retain silhouette clarity and interaction readability.

## Tal visual target

- Canonical black hawk silhouette.
- Curved hawk beak.
- Layered black feather forms.
- Expressive blue eyes.
- Defined wings, talons, and tail feathers.
- Cyan cloak with believable folds and gold trim.
- Controlled emissive accents.
- Blinking, head tilt, feather movement, cloak movement, and wing-adjustment idle animation.
- Teaching, pointing, guiding, and celebration animation targets.
- High, medium, and low LOD targets that preserve the hawk silhouette, eye readability, cloak identity, and guiding gestures.

## Initial performance budgets

- Hero high tier: maximum 12,000 rendered triangles.
- Tal high tier: maximum 10,000 rendered triangles.
- Combined high-tier character budget: maximum 22,000 triangles.
- Medium combined target: maximum 12,000 triangles.
- Low combined target: maximum 6,000 triangles.
- Prefer one primary material plus limited eye/cloak accent materials per character.
- Minimize character draw calls.
- Desktop textures: maximum 1024×1024 per principal map.
- Tablet textures: maximum 512×512.
- Mobile textures: maximum 256×256.
- Preserve reduced-motion behavior.
- Animation must be throttleable by distance and quality tier.

## Future binary-production workflow

1. Generate separate review GLBs through Replit, Blender, or another Git-enabled binary-capable environment.
2. Do not overwrite the current Hero or Tal GLBs.
3. Validate with Khronos glTF Validator.
4. Record file size, node count, mesh count, material count, triangle count, animations, and SHA-256.
5. Test through the query-controlled review switches.
6. Promote only after visual, interaction, performance, and mobile approval.

## Preservation requirements

Future character realism work must preserve all Stage 4–9 lessons, `orgintel-hq-progress-v1`, the guided tour, room gates and unlocks, player controls and boundaries, the existing Hero/Founder GLB, the existing Tal GLB, the Intelligence Core GLB, all atrium GLBs, character coordinates, interaction triggers, reduced-motion behavior, loading progress behavior, the complete atrium fallback chain, all Pass 4 and Pass 5 diagnostics and switches, and the landing page plus `/experience/` route.

---

## C2A Review Asset — Hero Character GLB (Revision 2)

**Generated:** 2026-07-21  
**File:** `./models/orgintel-hero-character-review.glb`  
**Generator script:** `scripts/generate-hero-character-glb.mjs`  
**Review URL:** `/experience/?perf=1&hero=review`

### Asset metrics

| Metric | Value |
|---|---|
| File size | 337,110 bytes (0.321 MB) |
| SHA-256 | `88b7e78d6d3d2f1e2475059b41e5410e42f67b707aff7881145ece453c539b43` |
| glTF validation errors | **0** |
| Triangle count | **9,066** (budget: 6,000–12,000 ✓) |
| Node count | 67 |
| Mesh count | 55 |
| Material count | 10 |
| Animation clips | 3 |

### Skeleton nodes (HERO_ prefix)

All named transform nodes carry `HERO_` prefixes. Root is `HERO_Root` at floor origin (y=0). Height ~1.80 scene units. Facing +Z; runtime applies `rotationY = Math.PI`.

```
HERO_Root
└── HERO_Hips
    ├── HERO_Torso
    │   ├── HERO_Head  ← positioned at neck pivot [0, 1.58, 0]
    │   ├── HERO_LeftArm
    │   │   └── HERO_LeftForearm
    │   │       └── HERO_LeftHand
    │   └── HERO_RightArm
    │       └── HERO_RightForearm
    │           └── HERO_RightHand
    ├── HERO_LeftLeg
    └── HERO_RightLeg
```

### Head animation pivot (C2A revision 2)

`HERO_Head` is now positioned at `[0, 1.58, 0]` (the actual neck/head pivot). All head mesh children carry an inverse local translation of `[0, -1.58, 0]` so their final world placement is unchanged. Rotating `HERO_Head` in `Hero_Idle`, `Hero_Observe`, and `Hero_Console` now spins around the neck area rather than the floor origin.

### Review runtime scale and lighting

| Setting | Value |
|---|---|
| Review Hero scale (`?hero=review`) | **2.6** |
| Effective displayed height | **~4.68 scene units** (matches procedural Hero silhouette) |
| Production Hero scale | 1.0 (unchanged) |
| Tal scale | 1.12 (unchanged) |
| Review halo scale | 3.6 × 1.8 (reduced from 6.5 × 3.2) |
| Review halo opacity | 0.16 (reduced from 0.38) |
| Review point-light intensity | 5 (reduced from 14) |

Review scale and glow reduction apply only when the review candidate loads successfully (`?hero=review`). Production-character lighting and fallback lighting are untouched.

### Embedded animation clips

| Name | Duration |
|---|---|
| `Hero_Idle` | 4.0 s |
| `Hero_Observe` | 2.4 s |
| `Hero_Console` | 1.5 s |

### Embedded PBR materials (no external textures)

| Material | Role | Metallic | Roughness |
|---|---|---|---|
| `skin` | Head, neck, hands — warm dark-brown | 0.0 | 0.70 |
| `blackFabric` | Jacket, shoulders, sleeves | 0.0 | 0.85 |
| `darkTrousers` | Thighs, lower legs | 0.0 | 0.80 |
| `cyanPiping` | Chest/waist bands, sleeve cuffs, boot rings — restrained emissive | 0.0 | 0.40 |
| `goldAccent` | Collar clasp, chest badge, epaulettes, belt | 0.9 | 0.28 |
| `bootLeather` | Boot uppers, heels | 0.0 | 0.90 |
| `hairDark` | Afro hair volume | 0.0 | 0.95 |
| `eyeWhite` | Sclera | 0.0 | 0.60 |
| `eyeIris` | Iris | 0.0 | 0.50 |
| `teethLip` | Lip region | 0.0 | 0.75 |

### Production asset integrity check

| Asset | SHA-256 |
|---|---|
| `founder.glb` | `d820636ae9b19e22b4e9379b2bb27258b43501a56d724311ad5c8c04ded7312a` |
| `tal.glb` | `f124a5c2124acbe806bcc0e2e19f89bb07b187fa1f422d73366e9cb525e12bcb` |
| `orgintel-headquarters-atrium-production.glb` | `b74ea013b1aeae9278d4f781ceeadea4ec742ff981052d24134fdfe6168d0cae` |

All three production assets confirmed byte-for-byte unchanged. `git diff --check` passes clean.
