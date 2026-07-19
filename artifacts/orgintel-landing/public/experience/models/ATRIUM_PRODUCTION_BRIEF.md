# OrgIntel Headquarters Atrium Environment

## Graybox production brief

This directory contains two review assets:

- `orgintel-headquarters-atrium-graybox.glb` — locked scale and layout reference.
- `orgintel-headquarters-atrium-production.glb` — production pass 1 with detailed architecture, expanded PBR material families, an embedded runtime base-color atlas, and live experience integration.

The graybox establishes navigation clearances, scale, and room placement. Production pass 1 adds two occupied balcony levels, office bays, architectural glass, stairs, floor inlays, ceiling coffers, portal depth, central-core detailing, practical fixtures, and environmental dressing. The production atrium is now connected to the live `/experience/` route through `experience/index.html`, with the procedural atrium retained as a fallback.

## Production pass 1 status

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

Production materials currently use the embedded base-color atlas in the runtime GLB. Normal maps, combined occlusion/roughness/metallic maps, and selective emissive maps remain pending. Glass may use glTF transmission and index-of-refraction extensions after target-device testing.

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

Regenerate production pass 1 from the project root when intentionally updating the GLB or atlas source:

```bash
node artifacts/orgintel-landing/scripts/generate-atrium-glb.mjs
```
