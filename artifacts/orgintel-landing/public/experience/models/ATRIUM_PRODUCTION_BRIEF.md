# OrgIntel Headquarters Atrium Environment

## Production brief

This directory contains two validated assets and documents isolated review assets:

- `orgintel-headquarters-atrium-graybox.glb` — locked scale and layout reference.
- `orgintel-headquarters-atrium-production.glb` — production pass 2 with detailed architecture, expanded PBR material families, an embedded runtime base-color atlas, and live experience integration.
- `orgintel-headquarters-atrium-pass3-review.glb` — validated Pass 3 PBR atrium and current primary live environment.
- `orgintel-headquarters-atrium-pass4-observatory-review.glb` — reserved Pass 4B open-sky Observatory aperture review output; generated outside Codex Cloud only after text review.

The graybox establishes navigation clearances, scale, and room placement. Production pass 1 adds two occupied balcony levels, office bays, architectural glass, stairs, floor inlays, ceiling coffers, portal depth, central-core detailing, practical fixtures, and environmental dressing. The production atrium is now connected to the live `/experience/` route through `experience/index.html`, with the procedural atrium retained as a fallback.

## Production pass 2 status

- Architectural detail: implemented
- PBR material separation: implemented
- Architectural glass extensions: implemented
- Office depth and warm practical-light surfaces: implemented
- Furniture and planting silhouettes: implemented
- Embedded 1024 × 1024 base-color material atlas: implemented in the runtime GLB
- External atlas PNG as generator source: retained
- Normal and combined occlusion/roughness/metallic maps: implemented and validated in Pass 3
- Nine bounded, non-shadow-casting `KHR_lights_punctual` lights: implemented
- Baked lightmaps and reflection probes: pending
- Runtime quality tiers and conservative distance visibility: Pass 4A runtime foundation implemented; geometry compression remains future additive review
- Live experience integration: implemented

## Live experience integration

`artifacts/orgintel-landing/public/experience/index.html` loads `./models/orgintel-headquarters-atrium-pass3-review.glb` as the default primary environment GLB, then falls back to `./models/orgintel-headquarters-atrium-production.glb`, then keeps `ProceduralAtriumFallback`. The isolated Pass 4B Observatory review GLB is query-controlled and is requested only when `?atrium=pass4` is present. The production atrium is added at the scene origin with identity rotation and scale `1`, and the previous procedural environment is grouped as `ProceduralAtriumFallback`.

`ProceduralAtriumFallback` remains visible while the GLB is loading and remains available if loading fails. After a successful production-atrium load, the fallback is hidden so visitors see the production floor and architecture instead of the procedural grid. Stations, lessons, character models, HUD elements, quality controls, desktop/mobile controls, reduced-motion behavior, and progression persistence remain independent of this environment swap.

## Runtime material and lighting notes

Pass 3 is active and validated in the live loader. The runtime preserves the current PMREM, bloom, exposure, glass, floor, and PBR material tuning for separate visual review. The production and Pass 3 GLBs preserve the existing PNG atlas assets; Pass 3 embeds base-color, normal, and combined ORM atlases. KTX2/Basis texture delivery, Meshopt/Draco compression, Blender-authored lightmaps, and reflection probes remain future additive review assets rather than replacements in this slice.

## Pass 3 isolated review workflow

Pass 3 begins as an additive review asset. The live loader, current production GLB, Pass 2 atlas, portal coordinates, collision behavior, lessons, progression, and procedural fallback remain unchanged during this phase.

The generator accepts `--pass3-review` and then requires these binary source textures beside the Pass 2 atlas:

- `textures/atrium-normal-atlas.png` — tangent-space normal atlas using the same four regions and padding as the base-color atlas.
- `textures/atrium-orm-atlas.png` — combined occlusion/roughness/metallic atlas with occlusion in red, roughness in green, and metalness in blue.

The review GLB embeds all three atlases and assigns the normal and ORM maps only to the four authored surface families. Material-specific normal and occlusion strengths keep the polished floor restrained while allowing stronger depth in charcoal stone and directional variation in brushed metal.

This first Pass 3 slice does not add reflection probes, modify bloom, tune the live glass, or switch runtime assets. Those changes depend on visual and performance approval of the review GLB.

### Pass 3 texture budgets

Source review atlases may remain 1024 × 1024 PNG files while materials are tuned. Delivery targets after visual approval are:

- Desktop: 1024 × 1024 base color, normal, and ORM atlases, converted to KTX2/Basis.
- Tablet: 1024 × 1024 base color and ORM; normal atlas may be reduced to 512 × 512 after comparison testing.
- Mobile: 512 × 512 atlases unless device testing demonstrates that 1024 × 1024 materially improves the visible result.
- ORM data must be treated as linear data; base color is sRGB; normal data is non-color/linear.
- The uncompressed review asset is never the final mobile delivery asset.

### Pass 3 validation gate

Before the review GLB can replace the production asset or be referenced by the live loader, verify:

1. Khronos validation reports zero errors and zero warnings.
2. Two consecutive generations produce identical SHA-256 hashes.
3. Portal coordinates and all named navigation nodes remain unchanged.
4. Floor response is polished but not mirror-like, with no visible normal-map seams.
5. Stone, titanium, and blackened steel remain distinguishable under cyan, gold, and warm practical lights.
6. Glass, reflections, bloom, and contact depth are evaluated separately after the PBR maps pass review.
7. Frame time and texture memory are recorded in Safari, desktop Chrome, tablet, and mobile quality modes.
8. The current production GLB and procedural fallback remain available for rollback.


## Pass 4A runtime performance foundation

Pass 4A is a reversible runtime layer only. It does not modify the validated GLB or PNG assets, does not alter station or portal coordinates, and can be disabled with the runtime feature flags in `experience/index.html` (`pass4=0`, plus focused `lod=0` and `contacts=0` query switches for review).

Runtime quality tiers are selected conservatively from viewport, pointer, and user-agent signals:

- Desktop: high
- Tablet: medium
- Mobile phone: low

The existing manual `Q·H`, `Q·M`, and `Q·L` control remains available and immediately refreshes runtime visibility and contact-depth state.

### Diagnostics

Optional performance diagnostics are hidden by default and appear only with `?perf=1`, including combined review URLs such as `?atrium=pass4&perf=1`. FPS and average frame time are calculated from raw consecutive `requestAnimationFrame` timestamps in milliseconds, separate from the normalized 60-FPS animation delta used by movement, camera interpolation, lessons, and ambient animation. Abnormal startup, hidden-tab, browser-suspension, and background-return timing gaps are ignored so the displayed sample reflects active frames.

Renderer statistics are reset once at the beginning of each diagnostics-enabled rendered frame, captured after the complete frame renders, and preserved until the next panel refresh. When bloom/post-processing is active through `EffectComposer`, the reported GPU draw calls and rendered triangles include the scene render plus post-processing passes; the labels intentionally avoid claiming that accumulated post-processing triangles are scene-visible geometry. When post-processing is unavailable, the same fields come from the normal `renderer.render(scene, camera)` path after rendering. The panel continues to report FPS, average frame time, GPU draw calls, rendered triangles, texture count, geometry count, current quality tier, and current atrium environment status, updates roughly twice per second, ignores pointer events, and remains readable on desktop and mobile without affecting lessons or controls.

Without `?perf=1`, diagnostics stay completely disabled and the renderer keeps its normal `renderer.info` auto-reset behavior so default visitors do not pay the diagnostics bookkeeping cost.

### LOD classification

Pass 4A classifies only established nonessential atrium node names for future distance-based LOD:

- Furniture: `PROP_BenchSeat`, `PROP_BenchBase`
- Foliage: `PROP_PlantTrunk`, `PROP_PlantCanopy`
- Planters: `PROP_Planter`
- Office dressing: `OFFICE_*_Desk`, `OFFICE_*_Display`, `OFFICE_*_Mullion`, `OFFICE_*_WarmLight`
- Kiosks: `KIOSK_*`
- Balcony details: balcony glass rails and other nonstructural balcony trim only
- Nonessential ceiling details: `CEILING_Coffer`, `CEILING_Practical`

The runtime does not classify or hide floors, walls, structural columns, stairs, balcony decks, portals, navigation paths, Intelligence Core dais geometry, primary ceiling structure, station or lesson geometry, collision behavior, or player boundaries. Visibility checks are throttled and use hysteresis so details do not flicker near tier thresholds. High keeps the widest radius, medium reduces distant dressing, and low uses the shortest radius.

### Contact depth

Pass 4A adds subtle floor contact depth using runtime-generated soft radial planes and a shared canvas texture. Contacts target column bases, stair landings, planters, benches, kiosks, and the Intelligence Core dais. The effect is non-directional, not mirror-like, not full-screen SSAO, enabled on high, reduced to essential contacts on medium, disabled on low, excluded from raycasting, and removable through the Pass 4 feature flag.

### Deferred visual/binary work

The Observatory ceiling opening remains deferred to a separate generator/binary pass. KTX2/Basis textures and Meshopt/Draco geometry compression remain future additive review assets. Existing GLB and PNG assets remain preserved.


## Pass 4B Intelligence Observatory open-sky review

Pass 4A runtime performance foundation is merged as the current reversible runtime layer. Its quality tiers, diagnostics, LOD classification, and contact-depth controls remain runtime-only and do not change the validated atrium binaries or atlas PNGs.

Pass 4B is an isolated generator mode for architectural review of the Intelligence Observatory roof opening. It starts from the complete validated Pass 3 PBR configuration, requires the existing base-color, normal, and ORM atlases, and writes only `orgintel-headquarters-atrium-pass4-observatory-review.glb`. Pass 3 remains the default public experience: normal `/experience/` visits continue to request `orgintel-headquarters-atrium-pass3-review.glb` before falling back to the Pass 2 production GLB and procedural atrium. The Pass 4B review asset is loaded only by the exact review URL parameter `?atrium=pass4`, which prepends `orgintel-headquarters-atrium-pass4-observatory-review.glb` to the same fallback chain without changing stations, portals, lessons, room gates, progression, or default visitor behavior.

New review command:

```bash
node artifacts/orgintel-landing/scripts/generate-atrium-glb.mjs --pass4-observatory-review
```

New review output:

- `artifacts/orgintel-landing/public/experience/models/orgintel-headquarters-atrium-pass4-observatory-review.glb`

The Pass 4B aperture is centered above the Intelligence Observatory viewing region near the existing station at `(46, 0)` and the preserved portal coordinate `(62, 0, 0)`. The generator removes only the obstructing Observatory ceiling coffer/practical-light cells and splits the long `CEILING_Beam_48` member into named north and south structural segments outside the opening. New deterministic rim nodes (`OBSERVATORY_ROOF_RimNorth`, `OBSERVATORY_ROOF_RimSouth`, `OBSERVATORY_ROOF_RimEast`, `OBSERVATORY_ROOF_RimWest`, `OBSERVATORY_ROOF_AccentNorth`, and `OBSERVATORY_ROOF_AccentSouth`) frame the open sky with existing metal, cyan, and gold material families while leaving the aperture center completely open. No skylight glass, frosted panel, transparent ceiling surface, decorative crossing mesh, or new bloom-heavy light is introduced.


### Pass 4B review asset validation

The reviewed Pass 4B GLB is present at `artifacts/orgintel-landing/public/experience/models/orgintel-headquarters-atrium-pass4-observatory-review.glb` with these validation results:

- Size: 5,283,800 bytes
- Nodes: 551
- Meshes: 23
- Materials: 15
- SHA-256: `e10d510f756b6bbfb02a8a4f04f088675f651ff28259a02415c0e8c9c71d9b99`
- Khronos validation: zero errors, warnings, infos, and hints

### Query-controlled review workflow

Use the exact review parameter `?atrium=pass4` to inspect Pass 4B in the live experience shell. For example, open `/experience/?atrium=pass4` for the review route, or `/experience/?atrium=pass4&perf=1` to combine the review GLB with the existing performance diagnostics panel. The runtime optimization switches remain reversible and independent: `pass4=0` disables Pass 4A runtime optimizations, while `lod=0` and `contacts=0` disable only their focused runtime layers. These optimization switches do not select or deselect the Pass 4B review asset; only `atrium=pass4` controls asset selection.

Expected loader order:

- Default `/experience/`: Pass 3 PBR atrium, then Pass 2 production atrium, then `ProceduralAtriumFallback`.
- Review `/experience/?atrium=pass4`: Pass 4B Observatory review atrium, then Pass 3 PBR atrium, then Pass 2 production atrium, then `ProceduralAtriumFallback`.

Status text confirms the active environment:

- `V6 · Pass 4B Observatory review active` when Pass 4B loads.
- `V5 · Pass 3 PBR atrium active · Pass 4B fallback` when Pass 4B fails and Pass 3 loads.
- Existing default statuses remain unchanged for normal visitors.

### Pass 4B rollback instructions

Rollback remains text-only and does not require changing Pass 2, Pass 3, or atlas binaries. Remove the `?atrium=pass4` review parameter to return to the default Pass 3 route. If the review asset needs to be withdrawn, delete only `orgintel-headquarters-atrium-pass4-observatory-review.glb` from the review environment or revert the query-controlled loader addition; the public default continues to use Pass 3. Do not replace `orgintel-headquarters-atrium-production.glb`, `orgintel-headquarters-atrium-pass3-review.glb`, or any PNG atlas as part of Pass 4B rollback.

### Replit binary-generation workflow

Codex Cloud may edit text only and must not generate or commit the Pass 4B GLB. After this text-only change is reviewed, generate the binary in Replit or another approved binary-authoring environment with the command above. Confirm the three atlas PNGs are present under `public/experience/models/textures/` before generation, then run Khronos validation and deterministic hash checks on the produced review GLB.

### Visual approval requirements

Before any live-loader change is considered, visually approve the Pass 4B review GLB in the cinematic upward Observatory camera movement and verify that:

1. The Intelligence Observatory constellation remains visible through the open roof aperture.
2. The center of the aperture is free of glass and opaque crossing geometry.
3. The rim reads as authored headquarters architecture from the Observatory floor.
4. The five portal coordinates, navigation paths, player boundaries, stairs, balcony decks, office bays, Intelligence Core reserve, Pass 3 PBR materials, explicit tangents, normal maps, ORM maps, and nine existing practical lights remain preserved.
5. The production Pass 2 GLB, Pass 3 review GLB, and all atlas PNGs remain unchanged.

### Rollback behavior

Rollback is unchanged because Pass 4B is review-only. If the aperture needs revision, discard the generated `orgintel-headquarters-atrium-pass4-observatory-review.glb` and continue using the live V5 Pass 3 loader. Do not replace `orgintel-headquarters-atrium-production.glb`, `orgintel-headquarters-atrium-pass3-review.glb`, or any texture atlas during Pass 4B review.

## Coordinate system

- Units: meters
- Up axis: Y
- Forward axis: -Z
- Scene origin: atrium floor center
- Architectural footprint: approximately 140 × 150 meters
- Atrium height: approximately 24 meters
- Intelligence Core reserve: `(0, 0, 8)`

## Existing room alignment

| Room | Existing experience station | Graybox portal |
|---|---:|---:|
| Memory Archive | `(-46, 0)` | `(-62, 0, 0)` |
| Decision Chamber | `(-30, -46)` | `(-31, 0, -70)` |
| Proof Vault | `(30, -46)` | `(31, 0, -70)` |
| Intelligence Observatory | `(46, 0)` | `(62, 0, 0)` |
| Operational Console | `(0, -62)` | `(0, 0, -76)` |

Station coordinates are expressed as X/Z in the current Three.js experience. Portal coordinates are X/Y/Z.

## Production modeling requirements

The final atrium should retain the node names and approximate footprint while replacing graybox meshes with production geometry.

Required architectural systems:

1. Polished dark-stone or composite floor with subtle cyan and gold inlays.
2. Two balcony levels with credible structure, stairs, glass rails, and occupied office depth.
3. Multi-story columns with integrated practical lighting.
4. Central ceiling rings aligned with the Intelligence Core.
5. Five visually distinct room portals without changing their navigation positions.
6. Exterior skyline or deep architectural backdrop visible through glass.
7. Modular planters, seating, workstations, signs, rails, fixtures, and display props.
8. Collision-friendly floor and stair geometry separated from visual meshes.

## Material families

Production pass 1 defines expanded material families, including:

- `MAT_Floor_PolishedNavy`
- `MAT_Structure_BlueBlackMetal`
- `MAT_Secondary_Gunmetal`
- `MAT_BlackenedSteel`
- `MAT_BrushedTitanium`
- `MAT_Wall_CharcoalStone`
- `MAT_Glass_Architectural`
- `MAT_Glass_Frosted`
- `MAT_Emissive_Teal`
- `MAT_Emissive_Gold`
- `MAT_Emissive_InteriorWarm`
- `MAT_Display_BlueBlack`
- `MAT_Upholstery_DeepTeal`
- `MAT_Foliage_DeepGreen`
- `MAT_Portal_Navy`

Production materials use embedded atlas textures in the runtime GLBs. Pass 3 normal and combined occlusion/roughness/metallic maps are active and validated for the Pass 3 review GLB. Selective emissive maps remain pending. Glass may use glTF transmission and index-of-refraction extensions after target-device testing.

Production pass 2 embeds `textures/atrium-material-atlas.png` into the GLB and assigns its four material regions with `KHR_texture_transform`:

- polished midnight-navy stone
- charcoal architectural stone
- brushed titanium
- blackened steel

The atlas is a restrained base-color layer. Material roughness, metallic response, clear coat, glass transmission, IOR, and emissive strength remain physically separated in the glTF materials. Normal and ORM maps are active in the Pass 3 PBR atrium and preserved as PNG source/review assets.

The GLB also carries nine bounded `KHR_lights_punctual` practical lights for the central core, office warmth, and console portal. They intentionally do not request shadows; cinematic key lighting and reflection probes remain the responsibility of the host scene.

## Environment budgets

Initial production targets:

- Desktop high-detail environment: 350,000–550,000 visible triangles
- Desktop draw calls: below 180 in a typical atrium view
- Mobile visible triangles: 120,000–220,000 through LODs
- Mobile draw calls: below 100 in a typical atrium view
- Texture memory: below 350 MB desktop and 160 MB mobile
- Repeated props: instanced
- Major architecture: three LOD levels
- Textures: KTX2/Basis compressed
- Geometry: Meshopt or Draco compressed after visual approval

These are engineering targets, not guarantees. They must be verified on representative desktop, tablet, and mobile hardware.

## File-delivery requirements

The production artist should deliver:

1. Editable `.blend` source with linked textures.
2. Uncompressed review GLB.
3. Optimized desktop GLB.
4. Optimized mobile GLB or compatible LOD hierarchy.
5. KTX2 textures and conversion settings.
6. Collision meshes prefixed `COL_`.
7. Lightmap UVs where baking is used.
8. A material and third-party asset license manifest.

## Acceptance criteria

- Opens at the correct scale with no manual rotation correction.
- No missing textures, invalid normals, or non-manifold visible surfaces.
- Existing player and station coordinates remain navigable.
- Intelligence Core, Tal, and founder models do not intersect architecture.
- Room portals are readable from the central atrium.
- High-quality mode maintains the agreed desktop frame target.
- Reduced-quality mode remains usable on mobile.
- GLB passes the Khronos glTF validator with no errors.

## Generation

Regenerate the current production asset from the project root only when intentionally updating the validated Pass 2 GLB or base-color atlas:

```bash
node artifacts/orgintel-landing/scripts/generate-atrium-glb.mjs
```

Generate the isolated Pass 3 review asset only after adding the two required texture sources:

```bash
node artifacts/orgintel-landing/scripts/generate-atrium-glb.mjs --pass3-review
```

The Pass 3 command writes `orgintel-headquarters-atrium-pass3-review.glb`. It never overwrites `orgintel-headquarters-atrium-production.glb`.

## Pass 4D runtime instancing and draw-call reduction

Pass 4D is a reversible, text-only runtime batching layer in `experience/index.html`. It targets the measured Pass 4B high-quality baseline of approximately 59 FPS, 17.1 ms average frame time, 873 GPU draw calls, 47,816 rendered triangles, 63 textures, and 241 geometries. The primary optimization target is GPU draw calls, not visual simplification or binary asset replacement.

### Runtime instancing design

After a GLB atrium candidate loads, the runtime first applies `prepareProductionAtrium(model)` so materials, shadows, identity root transform, and quality-tier tuning match the existing Pass 4B path. It then calls `createAtriumInstanceBatches(model)` before `registerAtriumRuntimeDetails(model)`. This order keeps batching downstream of material preparation while keeping the Pass 4A LOD collector focused on remaining individual meshes.

The batching pass walks the loaded atrium hierarchy and groups only safe opaque static meshes that share all compatibility properties required for a single `THREE.InstancedMesh` draw path:

- Same geometry object
- Same material object
- Same `castShadow` setting
- Same `receiveShadow` setting
- Static transform
- No skinning
- No morph targets
- No animation or interaction metadata
- No multiple-material array
- No transparent, glass, frosted, or transmissive material

Each created batch reuses the original geometry and material, preserves shadow flags, uses `StaticDrawUsage` for the instance matrix when Three.js exposes it, disables raycasting, and uses a deterministic `Pass4Batch_` name. Source meshes are removed from their original parents only after their replacement batch has been created. Shared geometry and materials are deliberately not disposed because the batch reuses them. The stored runtime statistics report the number of batches, source meshes consolidated, and total instances in the `?perf=1` panel.

Instance matrices are composed relative to the atrium model root from each source mesh's complete world transform. Because the batch root is added back under the same atrium model root, the visible position, rotation, and scale of each consolidated element remain unchanged. Batches conservatively disable frustum culling to avoid incorrect disappearance from shared bounds in the review environment.

### Eligible and excluded mesh categories

Initial safe candidates are intentionally conservative and limited to repeated opaque static architecture such as structural columns, column bases and caps, stair steps, floor inlays, ceiling coffers and framing not controlled by LOD, repeated opaque office structure, and repeated noninteractive Intelligence Core architectural pylons.

Pass 4D does not instance meshes already classified by the Pass 4A LOD system because those objects require individual distance visibility and hysteresis. Excluded LOD families include furniture, foliage, planters, office dressing, kiosks, balcony details, and nonessential ceiling details.

The runtime also excludes glass, frosted glass, transparent or transmissive meshes, skinned meshes, morph-target meshes, animated objects, Founder, Tal, the Intelligence Core character model, station lesson geometry, collision or player-boundary objects, interactive objects, objects with `interactiveReserved` metadata, objects required for raycasting, GLTF lights, and `Pass4RuntimeContactDepth`.

Navigation and interaction-sensitive node families are excluded by name or metadata before grouping: `PORTAL_*`, `PATH_*`, `KIOSK_*`, `COL_*`, station-related nodes, and any node carrying `roomId`, `roomLabel`, `interactiveReserved`, `walkable`, or `collision` metadata.

### Rollback and query flags

Runtime batching is controlled by `runtimePass4.instancing` and is independent from `atrium=pass4`, `pass4=0`, `lod=0`, `contacts=0`, and `perf=1`. Add `?batch=0` to disable instancing completely. When `batch=0` is present, the runtime skips `createAtriumInstanceBatches(model)` and leaves the original GLB hierarchy unchanged; it does not batch first and attempt to reconstruct nodes later.

Comparison URLs:

- `/experience/?atrium=pass4&perf=1` — Pass 4B review route with Pass 4D instancing enabled.
- `/experience/?atrium=pass4&perf=1&batch=0` — same review route with batching disabled for direct baseline comparison.

Do not merge Pass 4D until both URLs have been compared in Replit.

### Contact-depth instancing

The Pass 4A contact-depth floor accents now prefer a single `THREE.InstancedMesh` per active quality configuration. The generated canvas texture, material opacity, positions, scales, high/medium quality item lists, low-quality disabled behavior, and noninteractive raycast behavior are preserved. If `THREE.InstancedMesh` is unavailable, the runtime falls back to the previous individual plane meshes.

### Diagnostic comparison procedure

Use `?perf=1` to compare the post-render diagnostics panel for the two URLs above. Confirm that FPS and average frame time still use raw `requestAnimationFrame` milliseconds, renderer statistics are captured after rendering, GPU draw calls and rendered triangles are accurate for the active render path, and the panel reports instancing on/off, instance batch count, source meshes consolidated, and total instances. During review, verify transparent, animated, interactive, LOD-controlled, portal, path, and collision nodes remain unbatched; original world transforms are preserved; no shared geometry or material is disposed; each successfully batched source mesh is removed exactly once; and loaders, fallbacks, lessons, progression, coordinates, player boundaries, quality tiers, reduced-motion behavior, and all GLB/PNG assets remain unchanged.
