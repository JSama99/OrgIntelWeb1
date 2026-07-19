# OrgIntel Headquarters Atrium Environment

## Graybox production brief

This directory contains two validated assets and reserves a third isolated review asset:

- `orgintel-headquarters-atrium-graybox.glb` — locked scale and layout reference.
- `orgintel-headquarters-atrium-production.glb` — production pass 2 with detailed architecture, expanded PBR material families, an embedded runtime base-color atlas, and live experience integration.
- `orgintel-headquarters-atrium-pass3-review.glb` — reserved Pass 3 review output. It must not replace the production GLB before validation and live-integration approval.

The graybox establishes navigation clearances, scale, and room placement. Production pass 1 adds two occupied balcony levels, office bays, architectural glass, stairs, floor inlays, ceiling coffers, portal depth, central-core detailing, practical fixtures, and environmental dressing. The production atrium is now connected to the live `/experience/` route through `experience/index.html`, with the procedural atrium retained as a fallback.

## Production pass 2 status

- Architectural detail: implemented
- PBR material separation: implemented
- Architectural glass extensions: implemented
- Office depth and warm practical-light surfaces: implemented
- Furniture and planting silhouettes: implemented
- Embedded 1024 × 1024 base-color material atlas: implemented in the runtime GLB
- External atlas PNG as generator source: retained
- Normal and combined occlusion/roughness/metallic maps: pending
- Nine bounded, non-shadow-casting `KHR_lights_punctual` lights: implemented
- Baked lightmaps and reflection probes: pending
- Desktop/mobile LODs and geometry compression: pending
- Live experience integration: implemented

## Live experience integration

`artifacts/orgintel-landing/public/experience/index.html` loads `./models/orgintel-headquarters-atrium-production.glb` as the primary environment GLB. The production atrium is added at the scene origin with identity rotation and scale `1`, and the previous procedural environment is grouped as `ProceduralAtriumFallback`.

`ProceduralAtriumFallback` remains visible while the GLB is loading and remains available if loading fails. After a successful production-atrium load, the fallback is hidden so visitors see the production floor and architecture instead of the procedural grid. Stations, lessons, character models, HUD elements, quality controls, desktop/mobile controls, reduced-motion behavior, and progression persistence remain independent of this environment swap.

## Runtime material and lighting notes

The current production GLB includes a 1024 × 1024 base-color material atlas embedded in the runtime GLB. The external atlas PNG remains the generator source asset. Normal maps and combined occlusion/roughness/metallic maps are still pending. The GLB includes nine bounded `KHR_lights_punctual` practical lights, and runtime integration keeps embedded glTF lights non-shadow-casting. Blender-authored lightmaps, reflection probes, desktop/mobile LODs, and geometry compression remain pending.

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

Production materials currently use the embedded base-color atlas in the runtime GLB. The isolated Pass 3 review path supports normal and combined occlusion/roughness/metallic maps; these maps remain pending for the live production asset until validation is complete. Selective emissive maps remain pending. Glass may use glTF transmission and index-of-refraction extensions after target-device testing.

Production pass 2 embeds `textures/atrium-material-atlas.png` into the GLB and assigns its four material regions with `KHR_texture_transform`:

- polished midnight-navy stone
- charcoal architectural stone
- brushed titanium
- blackened steel

The atlas is a restrained base-color layer. Material roughness, metallic response, clear coat, glass transmission, IOR, and emissive strength remain physically separated in the glTF materials. Normal and ORM maps remain a later authored pass.

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
