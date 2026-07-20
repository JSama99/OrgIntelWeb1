# OrgIntel Headquarters Atrium Environment

## Production brief

This directory contains two validated assets and reserves a third isolated review asset:

- `orgintel-headquarters-atrium-graybox.glb` — locked scale and layout reference.
- `orgintel-headquarters-atrium-production.glb` — production pass 2 with detailed architecture, expanded PBR material families, an embedded runtime base-color atlas, and live experience integration.
- `orgintel-headquarters-atrium-pass3-review.glb` — validated Pass 3 PBR atrium and current primary live environment.

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

`artifacts/orgintel-landing/public/experience/index.html` loads `./models/orgintel-headquarters-atrium-pass3-review.glb` as the primary environment GLB, then falls back to `./models/orgintel-headquarters-atrium-production.glb`, then keeps `ProceduralAtriumFallback`. The production atrium is added at the scene origin with identity rotation and scale `1`, and the previous procedural environment is grouped as `ProceduralAtriumFallback`.

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

Optional performance diagnostics are hidden by default and appear only with `?perf=1`. The panel reports FPS, average frame time, draw calls, visible triangles, texture count, geometry count, current quality tier, and current atrium environment status. It updates roughly twice per second, ignores pointer events, and is styled to remain readable on desktop and mobile without affecting lessons or controls.

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
