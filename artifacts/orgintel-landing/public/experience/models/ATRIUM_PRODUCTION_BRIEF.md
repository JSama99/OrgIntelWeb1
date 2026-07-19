# OrgIntel Headquarters Atrium Environment

## Graybox production brief

This directory contains `orgintel-headquarters-atrium-graybox.glb`, the scale and layout reference for the production atrium environment.

The graybox is not final visual art. It establishes navigation clearances, architectural scale, room placement, naming, materials, and the boundary between the environment and the existing interactive room systems.

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

The graybox defines seven material families:

- `MAT_Floor_PolishedNavy`
- `MAT_Structure_BlueBlackMetal`
- `MAT_Secondary_Gunmetal`
- `MAT_Glass_Graybox`
- `MAT_Emissive_Teal`
- `MAT_Emissive_Gold`
- `MAT_Portal_Navy`

Production materials should use glTF-compatible PBR maps. Prominent surfaces should receive base color, roughness, metallic, normal, ambient-occlusion, and selective emissive maps. Glass may use glTF transmission and index-of-refraction extensions after target-device testing.

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

Regenerate the graybox from the project root:

```bash
node artifacts/orgintel-landing/scripts/generate-atrium-glb.mjs
```
