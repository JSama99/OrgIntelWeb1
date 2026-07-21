/**
 * OrgIntel Hero Character GLB Generator — C2A Review Pass
 *
 * Generates orgintel-hero-character-review.glb: a stylized Afro-futurist Black male
 * character for visual review. Loaded only under ?hero=review or ?characters=review.
 *
 * Usage: node generate-hero-character-glb.mjs
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public", "experience", "models", "orgintel-hero-character-review.glb");

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Build a UV-sphere. lat=stacks, lon=slices. Returns {positions, normals, uvs, indices}. */
function sphere(cx, cy, cz, r, lat, lon) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= lat; i++) {
    const theta = (i * Math.PI) / lat;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    for (let j = 0; j <= lon; j++) {
      const phi = (j * 2 * Math.PI) / lon;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      const nx = sinT * cosP;
      const ny = cosT;
      const nz = sinT * sinP;
      positions.push(cx + r * nx, cy + r * ny, cz + r * nz);
      normals.push(nx, ny, nz);
      uvs.push(j / lon, i / lat);
    }
  }
  for (let i = 0; i < lat; i++) {
    for (let j = 0; j < lon; j++) {
      const a = i * (lon + 1) + j;
      const b = a + lon + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, normals, uvs, indices };
}

/** Build a cylinder (open or closed). rTop/rBottom allow taper. */
function cylinder(cx, cy, cz, rTop, rBottom, height, radSegs, heightSegs, capTop = true, capBottom = true) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let idx = 0;

  // Body rings
  for (let iy = 0; iy <= heightSegs; iy++) {
    const t = iy / heightSegs;
    const y = cy + t * height;
    const r = rBottom + (rTop - rBottom) * t;
    for (let ix = 0; ix <= radSegs; ix++) {
      const phi = (ix / radSegs) * 2 * Math.PI;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      // Slope normal for tapered cylinders
      const slope = (rBottom - rTop) / height;
      const nLen = Math.sqrt(1 + slope * slope);
      positions.push(cx + r * cosP, y, cz + r * sinP);
      normals.push(cosP / nLen, slope / nLen, sinP / nLen);
      uvs.push(ix / radSegs, iy / heightSegs);
    }
  }
  for (let iy = 0; iy < heightSegs; iy++) {
    for (let ix = 0; ix < radSegs; ix++) {
      const a = iy * (radSegs + 1) + ix;
      const b = a + radSegs + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  idx = (heightSegs + 1) * (radSegs + 1);

  // Top cap
  if (capTop && rTop > 0) {
    const centerTop = idx;
    positions.push(cx, cy + height, cz);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);
    idx++;
    const rimStart = idx;
    for (let ix = 0; ix < radSegs; ix++) {
      const phi = (ix / radSegs) * 2 * Math.PI;
      positions.push(cx + rTop * Math.cos(phi), cy + height, cz + rTop * Math.sin(phi));
      normals.push(0, 1, 0);
      uvs.push(0.5 + 0.5 * Math.cos(phi), 0.5 + 0.5 * Math.sin(phi));
      idx++;
    }
    for (let ix = 0; ix < radSegs; ix++) {
      indices.push(centerTop, rimStart + ix, rimStart + (ix + 1) % radSegs);
    }
  }

  // Bottom cap
  if (capBottom && rBottom > 0) {
    const centerBot = idx;
    positions.push(cx, cy, cz);
    normals.push(0, -1, 0);
    uvs.push(0.5, 0.5);
    idx++;
    const rimStart = idx;
    for (let ix = 0; ix < radSegs; ix++) {
      const phi = (ix / radSegs) * 2 * Math.PI;
      positions.push(cx + rBottom * Math.cos(phi), cy, cz + rBottom * Math.sin(phi));
      normals.push(0, -1, 0);
      uvs.push(0.5 + 0.5 * Math.cos(phi), 0.5 + 0.5 * Math.sin(phi));
      idx++;
    }
    for (let ix = 0; ix < radSegs; ix++) {
      indices.push(centerBot, rimStart + (ix + 1) % radSegs, rimStart + ix);
    }
  }

  return { positions, normals, uvs, indices };
}

/** Box (6 faces, smooth normals per face). */
function box(cx, cy, cz, w, h, d) {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const faceData = [
    // px, nx, py, ny, pz, nz — [normal, 4 verts]
    { n: [0,0,1],  v: [[-hw,-hh,hd],[hw,-hh,hd],[hw,hh,hd],[-hw,hh,hd]] },
    { n: [0,0,-1], v: [[hw,-hh,-hd],[-hw,-hh,-hd],[-hw,hh,-hd],[hw,hh,-hd]] },
    { n: [1,0,0],  v: [[hw,-hh,hd],[hw,-hh,-hd],[hw,hh,-hd],[hw,hh,hd]] },
    { n: [-1,0,0], v: [[-hw,-hh,-hd],[-hw,-hh,hd],[-hw,hh,hd],[-hw,hh,-hd]] },
    { n: [0,1,0],  v: [[-hw,hh,hd],[hw,hh,hd],[hw,hh,-hd],[-hw,hh,-hd]] },
    { n: [0,-1,0], v: [[-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],[-hw,-hh,hd]] },
  ];
  const positions = [], normals = [], uvs = [], indices = [];
  let base = 0;
  for (const { n, v } of faceData) {
    for (const [vx, vy, vz] of v) {
      positions.push(cx + vx, cy + vy, cz + vz);
      normals.push(...n);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(base, base+1, base+2, base, base+2, base+3);
    base += 4;
  }
  return { positions, normals, uvs, indices };
}

/** Torus */
function torus(cx, cy, cz, majorR, minorR, majorSegs, minorSegs) {
  const positions = [], normals = [], uvs = [], indices = [];
  for (let i = 0; i <= majorSegs; i++) {
    const theta = (i / majorSegs) * 2 * Math.PI;
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    for (let j = 0; j <= minorSegs; j++) {
      const phi = (j / minorSegs) * 2 * Math.PI;
      const cosP = Math.cos(phi), sinP = Math.sin(phi);
      const x = (majorR + minorR * cosP) * cosT;
      const y = minorR * sinP;
      const z = (majorR + minorR * cosP) * sinT;
      positions.push(cx + x, cy + y, cz + z);
      normals.push(cosP * cosT, sinP, cosP * sinT);
      uvs.push(i / majorSegs, j / minorSegs);
    }
  }
  for (let i = 0; i < majorSegs; i++) {
    for (let j = 0; j < minorSegs; j++) {
      const a = i * (minorSegs + 1) + j;
      const b = a + minorSegs + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, normals, uvs, indices };
}

/** Partial sphere (hemisphere or cap slice) */
function sphereCap(cx, cy, cz, r, lat, lon, thetaMin, thetaMax) {
  const positions = [], normals = [], uvs = [], indices = [];
  for (let i = 0; i <= lat; i++) {
    const theta = thetaMin + (i / lat) * (thetaMax - thetaMin);
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    for (let j = 0; j <= lon; j++) {
      const phi = (j / lon) * 2 * Math.PI;
      const sinP = Math.sin(phi), cosP = Math.cos(phi);
      const nx = sinT * cosP, ny = cosT, nz = sinT * sinP;
      positions.push(cx + r * nx, cy + r * ny, cz + r * nz);
      normals.push(nx, ny, nz);
      uvs.push(j / lon, i / lat);
    }
  }
  for (let i = 0; i < lat; i++) {
    for (let j = 0; j < lon; j++) {
      const a = i * (lon + 1) + j, b = a + lon + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, normals, uvs, indices };
}

// ---------------------------------------------------------------------------
// Material definitions (PBR, no external textures)
// ---------------------------------------------------------------------------
const MATERIALS = {
  skin:         { name: "skin",         baseColor: [0.28, 0.15, 0.08, 1.0], metallic: 0.0, roughness: 0.70 },
  blackFabric:  { name: "blackFabric",  baseColor: [0.04, 0.04, 0.06, 1.0], metallic: 0.0, roughness: 0.85 },
  darkTrousers: { name: "darkTrousers", baseColor: [0.05, 0.06, 0.09, 1.0], metallic: 0.0, roughness: 0.80 },
  cyanPiping:   { name: "cyanPiping",   baseColor: [0.12, 0.88, 0.78, 1.0], metallic: 0.0, roughness: 0.40, emissive: [0.05, 0.35, 0.30] },
  goldAccent:   { name: "goldAccent",   baseColor: [1.00, 0.71, 0.33, 1.0], metallic: 0.9, roughness: 0.28 },
  bootLeather:  { name: "bootLeather",  baseColor: [0.06, 0.05, 0.04, 1.0], metallic: 0.0, roughness: 0.90 },
  hairDark:     { name: "hairDark",     baseColor: [0.04, 0.03, 0.03, 1.0], metallic: 0.0, roughness: 0.95 },
  eyeWhite:     { name: "eyeWhite",     baseColor: [0.92, 0.92, 0.90, 1.0], metallic: 0.0, roughness: 0.60 },
  eyeIris:      { name: "eyeIris",      baseColor: [0.18, 0.25, 0.32, 1.0], metallic: 0.0, roughness: 0.50 },
  teethLip:     { name: "teethLip",     baseColor: [0.20, 0.08, 0.06, 1.0], metallic: 0.0, roughness: 0.75 },
};

const MAT_KEYS = Object.keys(MATERIALS);

// ---------------------------------------------------------------------------
// Character geometry — all coords are world-space (origin at floor center)
// facing +Z (runtime applies rotationY=Math.PI to face -Z toward camera)
// ---------------------------------------------------------------------------

// Height map (y values, origin at floor y=0, total height ~1.80)
const Y = {
  floorBot:    0.00,
  bootTop:     0.12,
  lowerLegBot: 0.12,
  lowerLegTop: 0.50,
  kneeY:       0.50,
  thighTop:    0.84,
  hipCenter:   0.84,
  waist:       0.90,
  chest:       1.20,
  shoulderY:   1.32,
  neckBot:     1.33,
  neckTop:     1.45,
  headCenter:  1.58,
  hairCenter:  1.68,
};

const X_HIP = 0.10;   // half-width between leg centers
const X_SHOULDER = 0.22; // half-width between shoulder centers

// Collect mesh parts: [{geo, matKey, name}]
const parts = [];

function addPart(name, matKey, geo) {
  parts.push({ name, matKey, geo });
}

// --- Head (skin) ---
addPart("mesh_Head", "skin", sphere(0, Y.headCenter, 0, 0.155, 28, 28));

// --- Face features — brow ridge (flattened sphere cap front) ---
// Nose — small protruding box-like shape
addPart("mesh_Nose", "skin", box(0, Y.headCenter - 0.010, -0.155, 0.040, 0.032, 0.035));

// Lips — thin horizontal box
addPart("mesh_Lips", "teethLip", box(0, Y.headCenter - 0.065, -0.145, 0.072, 0.018, 0.012));

// Left eye white + iris
addPart("mesh_EyeWhiteL", "eyeWhite", sphere(-0.052, Y.headCenter + 0.022, -0.138, 0.028, 10, 14));
addPart("mesh_EyeIrisL",  "eyeIris",  sphere(-0.052, Y.headCenter + 0.022, -0.151, 0.016, 8, 12));
addPart("mesh_EyeWhiteR", "eyeWhite", sphere( 0.052, Y.headCenter + 0.022, -0.138, 0.028, 10, 14));
addPart("mesh_EyeIrisR",  "eyeIris",  sphere( 0.052, Y.headCenter + 0.022, -0.151, 0.016, 8, 12));

// Ear stubs
addPart("mesh_EarL", "skin", sphere(-0.155, Y.headCenter + 0.002, 0.000, 0.022, 8, 10));
addPart("mesh_EarR", "skin", sphere( 0.155, Y.headCenter + 0.002, 0.000, 0.022, 8, 10));

// --- Afro hair (slightly larger sphere, dark) ---
addPart("mesh_Hair", "hairDark", sphere(0, Y.hairCenter, 0.010, 0.192, 24, 26));

// --- Neck ---
addPart("mesh_Neck", "skin",
  cylinder(0, Y.neckBot, 0, 0.048, 0.058, Y.neckTop - Y.neckBot, 14, 2, true, false));

// --- Torso / Jacket body ---
// Main torso cylinder (tapered slightly toward waist)
addPart("mesh_Torso", "blackFabric",
  cylinder(0, Y.waist, 0, 0.185, 0.160, Y.shoulderY - Y.waist, 20, 4, false, false));

// Chest plate front detail (slightly protruding box)
addPart("mesh_ChestPlate", "blackFabric",
  box(0, Y.chest, -0.175, 0.200, 0.140, 0.018));

// Jacket collar / lapels (two angled boxes)
addPart("mesh_LapelL", "blackFabric",
  box(-0.045, Y.shoulderY - 0.04, -0.172, 0.055, 0.120, 0.014));
addPart("mesh_LapelR", "blackFabric",
  box( 0.045, Y.shoulderY - 0.04, -0.172, 0.055, 0.120, 0.014));

// Waist / jacket skirt  
addPart("mesh_JacketSkirt", "blackFabric",
  cylinder(0, Y.hipCenter - 0.04, 0, 0.165, 0.150, 0.10, 18, 2, false, false));

// --- Cyan piping — horizontal chest band ---
addPart("mesh_CyanBandChest", "cyanPiping",
  torus(0, Y.chest - 0.02, 0, 0.178, 0.008, 20, 8));

// Shoulder cyan stripes (thin torus arcs approximated as small tori)
addPart("mesh_CyanBandWaist", "cyanPiping",
  torus(0, Y.waist + 0.02, 0, 0.162, 0.007, 20, 7));

// Cyan sleeve cuff bands
addPart("mesh_CyanCuffL", "cyanPiping",
  torus(-X_SHOULDER - 0.01, Y.shoulderY - 0.35, 0, 0.055, 0.007, 14, 7));
addPart("mesh_CyanCuffR", "cyanPiping",
  torus( X_SHOULDER + 0.01, Y.shoulderY - 0.35, 0, 0.055, 0.007, 14, 7));

// --- Gold accents ---
// Collar clasp
addPart("mesh_GoldCollar", "goldAccent",
  torus(0, Y.neckBot + 0.01, 0, 0.055, 0.010, 16, 8));

// Chest badge (small sphere)
addPart("mesh_ChestBadge", "goldAccent",
  sphere(0, Y.chest + 0.035, -0.184, 0.022, 8, 12));

// Belt buckle
addPart("mesh_BeltBuckle", "goldAccent",
  box(0, Y.hipCenter + 0.018, -0.160, 0.042, 0.025, 0.012));

// Belt strap  
addPart("mesh_Belt", "goldAccent",
  cylinder(0, Y.hipCenter + 0.005, 0, 0.158, 0.158, 0.020, 20, 1, false, false));

// Shoulder epaulettes
addPart("mesh_EpauletteL", "goldAccent",
  cylinder(-X_SHOULDER - 0.005, Y.shoulderY - 0.02, 0, 0.060, 0.070, 0.022, 10, 1, true, false));
addPart("mesh_EpauletteR", "goldAccent",
  cylinder( X_SHOULDER + 0.005, Y.shoulderY - 0.02, 0, 0.060, 0.070, 0.022, 10, 1, true, false));

// --- Shoulders ---
addPart("mesh_ShoulderL", "blackFabric",
  sphere(-X_SHOULDER - 0.005, Y.shoulderY - 0.005, 0, 0.072, 10, 12));
addPart("mesh_ShoulderR", "blackFabric",
  sphere( X_SHOULDER + 0.005, Y.shoulderY - 0.005, 0, 0.072, 10, 12));

// --- Upper Arms ---
const ARM_TOP_Y = Y.shoulderY - 0.055;
const ARM_BOT_Y = ARM_TOP_Y - 0.215;
addPart("mesh_UpperArmL", "blackFabric",
  cylinder(-X_SHOULDER - 0.005, ARM_BOT_Y, 0, 0.050, 0.060, ARM_TOP_Y - ARM_BOT_Y, 14, 3, false, false));
addPart("mesh_UpperArmR", "blackFabric",
  cylinder( X_SHOULDER + 0.005, ARM_BOT_Y, 0, 0.050, 0.060, ARM_TOP_Y - ARM_BOT_Y, 14, 3, false, false));

// Elbow joint
addPart("mesh_ElbowL", "blackFabric",
  sphere(-X_SHOULDER - 0.005, ARM_BOT_Y + 0.02, 0, 0.052, 8, 10));
addPart("mesh_ElbowR", "blackFabric",
  sphere( X_SHOULDER + 0.005, ARM_BOT_Y + 0.02, 0, 0.052, 8, 10));

// --- Forearms ---
const FORE_TOP_Y = ARM_BOT_Y - 0.010;
const FORE_BOT_Y = FORE_TOP_Y - 0.190;
addPart("mesh_ForearmL", "blackFabric",
  cylinder(-X_SHOULDER - 0.005, FORE_BOT_Y, 0, 0.040, 0.050, FORE_TOP_Y - FORE_BOT_Y, 14, 2, false, false));
addPart("mesh_ForearmR", "blackFabric",
  cylinder( X_SHOULDER + 0.005, FORE_BOT_Y, 0, 0.040, 0.050, FORE_TOP_Y - FORE_BOT_Y, 14, 2, false, false));

// --- Hands (skin) ---
addPart("mesh_HandL", "skin",
  sphere(-X_SHOULDER - 0.005, FORE_BOT_Y - 0.052, 0, 0.048, 12, 14));
addPart("mesh_HandR", "skin",
  sphere( X_SHOULDER + 0.005, FORE_BOT_Y - 0.052, 0, 0.048, 12, 14));

// Thumb stubs
addPart("mesh_ThumbL", "skin",
  cylinder(-X_SHOULDER - 0.042, FORE_BOT_Y - 0.060, -0.020, 0.014, 0.016, 0.060, 8, 1, true, false));
addPart("mesh_ThumbR", "skin",
  cylinder( X_SHOULDER + 0.042, FORE_BOT_Y - 0.060, -0.020, 0.014, 0.016, 0.060, 8, 1, true, false));

// --- Thighs ---
const THIGH_TOP_Y = Y.hipCenter - 0.06;
const THIGH_BOT_Y = Y.kneeY + 0.020;
addPart("mesh_ThighL", "darkTrousers",
  cylinder(-X_HIP, THIGH_BOT_Y, 0, 0.072, 0.085, THIGH_TOP_Y - THIGH_BOT_Y, 16, 3, false, false));
addPart("mesh_ThighR", "darkTrousers",
  cylinder( X_HIP, THIGH_BOT_Y, 0, 0.072, 0.085, THIGH_TOP_Y - THIGH_BOT_Y, 16, 3, false, false));

// Groin bridge (connects thighs)
addPart("mesh_HipBridge", "darkTrousers",
  cylinder(0, Y.hipCenter - 0.14, 0, 0.115, 0.120, 0.12, 18, 2, false, false));

// Knee caps
addPart("mesh_KneeL", "darkTrousers",
  sphere(-X_HIP, Y.kneeY + 0.018, -0.002, 0.072, 8, 10));
addPart("mesh_KneeR", "darkTrousers",
  sphere( X_HIP, Y.kneeY + 0.018, -0.002, 0.072, 8, 10));

// --- Lower Legs ---
const LOWER_BOT_Y = Y.lowerLegBot;
const LOWER_TOP_Y = Y.lowerLegTop;
addPart("mesh_LowerLegL", "darkTrousers",
  cylinder(-X_HIP, LOWER_BOT_Y, 0, 0.054, 0.062, LOWER_TOP_Y - LOWER_BOT_Y, 14, 3, false, false));
addPart("mesh_LowerLegR", "darkTrousers",
  cylinder( X_HIP, LOWER_BOT_Y, 0, 0.054, 0.062, LOWER_TOP_Y - LOWER_BOT_Y, 14, 3, false, false));

// --- Boots ---
// Boot ankle cylinders
addPart("mesh_AnkleL", "bootLeather",
  cylinder(-X_HIP, Y.floorBot + 0.005, 0, 0.056, 0.054, 0.120, 14, 2, false, false));
addPart("mesh_AnkleR", "bootLeather",
  cylinder( X_HIP, Y.floorBot + 0.005, 0, 0.056, 0.054, 0.120, 14, 2, false, false));

// Boot toe boxes (slightly forward)
addPart("mesh_BootToeL", "bootLeather",
  box(-X_HIP, 0.04, -0.082, 0.106, 0.065, 0.135));
addPart("mesh_BootToeR", "bootLeather",
  box( X_HIP, 0.04, -0.082, 0.106, 0.065, 0.135));

// Boot soles
addPart("mesh_SoleL", "blackFabric",
  box(-X_HIP, 0.005, -0.050, 0.108, 0.010, 0.185));
addPart("mesh_SoleR", "blackFabric",
  box( X_HIP, 0.005, -0.050, 0.108, 0.010, 0.185));

// Boot heel
addPart("mesh_HeelL", "bootLeather",
  box(-X_HIP, 0.032, 0.068, 0.100, 0.052, 0.060));
addPart("mesh_HeelR", "bootLeather",
  box( X_HIP, 0.032, 0.068, 0.100, 0.052, 0.060));

// Cyan boot piping
addPart("mesh_BootPipingL", "cyanPiping",
  torus(-X_HIP, 0.108, 0, 0.056, 0.005, 14, 6));
addPart("mesh_BootPipingR", "cyanPiping",
  torus( X_HIP, 0.108, 0, 0.056, 0.005, 14, 6));

// ---------------------------------------------------------------------------
// glTF assembly
// ---------------------------------------------------------------------------

// Buffer layout: for each part, store [indices, positions, normals, uvs]
// We will build one flat buffer with all data.

const bufferChunks = []; // Uint8Array[]
let byteOffset = 0;

const bufferViews = [];
const accessors = [];
const meshes = [];
const nodes = [];

function pad4(n) { return Math.ceil(n / 4) * 4; }

function pushData(typedArray) {
  const buf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  const padded = pad4(buf.byteLength);
  const chunk = Buffer.alloc(padded, 0);
  buf.copy(chunk);
  bufferChunks.push(chunk);
  const start = byteOffset;
  byteOffset += padded;
  return { start, length: buf.byteLength };
}

let triCount = 0;

for (let pi = 0; pi < parts.length; pi++) {
  const { name, matKey, geo } = parts[pi];
  const matIdx = MAT_KEYS.indexOf(matKey);

  const idxArr = new Uint32Array(geo.indices);
  const posArr = new Float32Array(geo.positions);
  const nrmArr = new Float32Array(geo.normals);
  const uvArr  = new Float32Array(geo.uvs);

  triCount += idxArr.length / 3;

  // Indices BV + accessor
  const idxChunk = pushData(idxArr);
  const idxBV = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: idxChunk.start, byteLength: idxChunk.length });
  const idxAcc = accessors.length;
  accessors.push({
    bufferView: idxBV, componentType: 5125 /* UNSIGNED_INT */, count: idxArr.length, type: "SCALAR",
    min: [0], max: [geo.positions.length / 3 - 1],
  });

  // Compute position bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < geo.positions.length; i += 3) {
    minX = Math.min(minX, geo.positions[i]);   maxX = Math.max(maxX, geo.positions[i]);
    minY = Math.min(minY, geo.positions[i+1]); maxY = Math.max(maxY, geo.positions[i+1]);
    minZ = Math.min(minZ, geo.positions[i+2]); maxZ = Math.max(maxZ, geo.positions[i+2]);
  }

  // Positions BV + accessor
  const posChunk = pushData(posArr);
  const posBV = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: posChunk.start, byteLength: posChunk.length });
  const posAcc = accessors.length;
  accessors.push({
    bufferView: posBV, componentType: 5126 /* FLOAT */, count: posArr.length / 3, type: "VEC3",
    min: [minX, minY, minZ], max: [maxX, maxY, maxZ],
  });

  // Normals BV + accessor
  const nrmChunk = pushData(nrmArr);
  const nrmBV = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: nrmChunk.start, byteLength: nrmChunk.length });
  const nrmAcc = accessors.length;
  accessors.push({
    bufferView: nrmBV, componentType: 5126, count: nrmArr.length / 3, type: "VEC3",
  });

  // UVs BV + accessor
  const uvChunk = pushData(uvArr);
  const uvBV = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: uvChunk.start, byteLength: uvChunk.length });
  const uvAcc = accessors.length;
  accessors.push({
    bufferView: uvBV, componentType: 5126, count: uvArr.length / 2, type: "VEC2",
  });

  meshes.push({
    name,
    primitives: [{
      attributes: { POSITION: posAcc, NORMAL: nrmAcc, TEXCOORD_0: uvAcc },
      indices: idxAcc,
      material: matIdx,
      mode: 4,
    }],
  });

  nodes.push({ name, mesh: pi });
}

// ---------------------------------------------------------------------------
// Fix HERO_Head pivot: add inverse translations to head-group mesh nodes.
// HERO_Head will be positioned at the actual neck/head pivot (y = Y.headCenter).
// Each head mesh child receives translation [0, -Y.headCenter, 0] so its final
// world placement is unchanged, but rotations on HERO_Head spin around the pivot.
// ---------------------------------------------------------------------------
const HEAD_PIVOT_Y = Y.headCenter; // 1.58
const HEAD_MESH_NAMES = new Set([
  "mesh_Head", "mesh_Nose", "mesh_Lips",
  "mesh_EyeWhiteL", "mesh_EyeIrisL", "mesh_EyeWhiteR", "mesh_EyeIrisR",
  "mesh_EarL", "mesh_EarR", "mesh_Hair",
]);
for (const n of nodes) {
  if (HEAD_MESH_NAMES.has(n.name)) {
    n.translation = [0, -HEAD_PIVOT_Y, 0];
  }
}

// ---------------------------------------------------------------------------
// Node hierarchy — HERO_ skeleton transform nodes
// ---------------------------------------------------------------------------
// Map mesh node indices by name
function meshNodeIdx(name) { return nodes.findIndex(n => n.name === name); }
// All mesh node indices
const allMeshNodeIndices = nodes.map((_, i) => i);

// Create HERO_ skeleton nodes (no mesh, transform only)
// These sit on top of the mesh nodes.

const skeletonNodes = [];
function addSkelNode(name, translation, children) {
  const idx = nodes.length;
  nodes.push({ name, ...(translation ? { translation } : {}), ...(children && children.length ? { children } : {}) });
  skeletonNodes.push(idx);
  return idx;
}

// Collect mesh children by logical group
function collectChildren(...names) {
  return names.map(n => meshNodeIdx(n)).filter(i => i >= 0);
}

// ---------------------------------------------------------------------------
// NOTE: All mesh vertices are already in world space (baked absolute coords).
// Skeleton HERO_ nodes are pure logical grouping containers — NO translations.
// Translations on skeleton nodes would double-apply and corrupt placement.
// Animation channels use relative deltas (e.g. bob = [0,Δy,0] not [0,absY+Δy,0]).
// ---------------------------------------------------------------------------

// HERO_LeftHand
const heroLeftHand = addSkelNode("HERO_LeftHand", null,
  collectChildren("mesh_HandL", "mesh_ThumbL"));

// HERO_RightHand
const heroRightHand = addSkelNode("HERO_RightHand", null,
  collectChildren("mesh_HandR", "mesh_ThumbR"));

// HERO_LeftForearm → contains forearm mesh + hand node
const heroLeftForearm = addSkelNode("HERO_LeftForearm", null,
  [...collectChildren("mesh_ForearmL", "mesh_CyanCuffL"), heroLeftHand]);

// HERO_RightForearm
const heroRightForearm = addSkelNode("HERO_RightForearm", null,
  [...collectChildren("mesh_ForearmR", "mesh_CyanCuffR"), heroRightHand]);

// HERO_LeftArm → upper arm + elbow + forearm
const heroLeftArm = addSkelNode("HERO_LeftArm", null,
  [...collectChildren("mesh_UpperArmL", "mesh_ElbowL", "mesh_ShoulderL", "mesh_EpauletteL"), heroLeftForearm]);

// HERO_RightArm
const heroRightArm = addSkelNode("HERO_RightArm", null,
  [...collectChildren("mesh_UpperArmR", "mesh_ElbowR", "mesh_ShoulderR", "mesh_EpauletteR"), heroRightForearm]);

// HERO_Head — positioned at neck/head pivot; mesh children carry inverse offsets
const heroHead = addSkelNode("HERO_Head", [0, HEAD_PIVOT_Y, 0],
  collectChildren("mesh_Head","mesh_Nose","mesh_Lips",
    "mesh_EyeWhiteL","mesh_EyeIrisL","mesh_EyeWhiteR","mesh_EyeIrisR",
    "mesh_EarL","mesh_EarR","mesh_Hair"));

// HERO_Torso — no translation; torso geometry is already at world y≈0.90–1.35
const heroTorso = addSkelNode("HERO_Torso", null,
  [...collectChildren("mesh_Torso","mesh_ChestPlate","mesh_LapelL","mesh_LapelR",
    "mesh_JacketSkirt","mesh_CyanBandChest","mesh_CyanBandWaist",
    "mesh_GoldCollar","mesh_ChestBadge","mesh_Belt","mesh_BeltBuckle",
    "mesh_Neck"),
   heroHead, heroLeftArm, heroRightArm]);

// HERO_LeftLeg — no translation; leg geometry is already in world space
const heroLeftLeg = addSkelNode("HERO_LeftLeg", null,
  collectChildren("mesh_ThighL","mesh_KneeL","mesh_LowerLegL",
    "mesh_AnkleL","mesh_BootToeL","mesh_SoleL","mesh_HeelL","mesh_BootPipingL"));

// HERO_RightLeg
const heroRightLeg = addSkelNode("HERO_RightLeg", null,
  collectChildren("mesh_ThighR","mesh_KneeR","mesh_LowerLegR",
    "mesh_AnkleR","mesh_BootToeR","mesh_SoleR","mesh_HeelR","mesh_BootPipingR"));

// HERO_Hips — no translation; geometry already positioned at world y≈0.84
const heroHips = addSkelNode("HERO_Hips", null,
  [...collectChildren("mesh_HipBridge"), heroTorso, heroLeftLeg, heroRightLeg]);

// HERO_Root — scene root, no translation (geometry origin at floor y=0)
const heroRoot = addSkelNode("HERO_Root", null, [heroHips]);

// Scene
const scene = { nodes: [heroRoot] };

// ---------------------------------------------------------------------------
// Materials glTF
// ---------------------------------------------------------------------------
const gltfMaterials = MAT_KEYS.map(k => {
  const m = MATERIALS[k];
  const mat = {
    name: m.name,
    pbrMetallicRoughness: {
      baseColorFactor: m.baseColor,
      metallicFactor: m.metallic,
      roughnessFactor: m.roughness,
    },
    doubleSided: false,
  };
  if (m.emissive) mat.emissiveFactor = m.emissive;
  return mat;
});

// ---------------------------------------------------------------------------
// Optional animations — Hero_Idle, Hero_Observe, Hero_Console
// (simple key-frame channels on HERO_Head and HERO_Hips for review preview)
// ---------------------------------------------------------------------------
const animAccessors = [];
const animBVs = [];

function pushAnimData(arr) {
  const chunk = pushData(arr);
  const bvIdx = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: chunk.start, byteLength: chunk.length });
  const accIdx = accessors.length;
  return { bvIdx, accIdx };
}

// Common time inputs
const idleTimes = new Float32Array([0, 1, 2, 3, 4]);      // 4s loop
const observeTimes = new Float32Array([0, 0.8, 1.6, 2.4]); // 2.4s
const consoleTimes = new Float32Array([0, 0.5, 1.0, 1.5]); // 1.5s

// Head nod quaternions (subtle Y rotation for Observe, tilt for Idle)
// Identity quat [0,0,0,1], slight nod = small X rotation
const QUAT_ID   = [0, 0, 0, 1];
const QUAT_NOD  = [0.026, 0, 0, 0.9997]; // ~3° X tilt (nod)
const QUAT_LOOK = [0, 0.052, 0, 0.9986]; // ~6° Y (look aside)
const QUAT_DOWN = [0.052, 0, 0, 0.9986]; // ~6° X (look console)

// Hips translation — gentle breathing bob (relative deltas from node origin [0,0,0])
// HERO_Hips has no base translation so keyframes are pure relative offsets.
const HIP_Y0  = 0.000;
const HIP_Y1  = 0.004;

function makeQuatTrack(...quats) {
  const arr = new Float32Array(quats.flat());
  return arr;
}
function makeTransTrack(...translations) {
  const arr = new Float32Array(translations.flat());
  return arr;
}

// --- Hero_Idle animation ---
const idleTimeChunk = pushAnimData(idleTimes);
const idleTimeAcc = accessors.length;
accessors.push({ bufferView: idleTimeChunk.bvIdx, componentType: 5126, count: idleTimes.length, type: "SCALAR",
  min: [0], max: [4] });

const idleHeadQuats = makeQuatTrack(QUAT_ID, QUAT_NOD, QUAT_ID, QUAT_NOD, QUAT_ID);
const idleHeadChunk = pushAnimData(idleHeadQuats);
const idleHeadAcc = accessors.length;
accessors.push({ bufferView: idleHeadChunk.bvIdx, componentType: 5126, count: 5, type: "VEC4" });

const idleHipTrans = makeTransTrack([0,HIP_Y0,0],[0,HIP_Y1,0],[0,HIP_Y0,0],[0,HIP_Y1,0],[0,HIP_Y0,0]);
const idleHipChunk = pushAnimData(idleHipTrans);
const idleHipAcc = accessors.length;
accessors.push({ bufferView: idleHipChunk.bvIdx, componentType: 5126, count: 5, type: "VEC3" });

// --- Hero_Observe animation ---
const obsTimeChunk = pushAnimData(observeTimes);
const obsTimeAcc = accessors.length;
accessors.push({ bufferView: obsTimeChunk.bvIdx, componentType: 5126, count: observeTimes.length, type: "SCALAR",
  min: [0], max: [2.4] });

const obsHeadQuats = makeQuatTrack(QUAT_ID, QUAT_LOOK, QUAT_ID, QUAT_LOOK);
const obsHeadChunk = pushAnimData(obsHeadQuats);
const obsHeadAcc = accessors.length;
accessors.push({ bufferView: obsHeadChunk.bvIdx, componentType: 5126, count: 4, type: "VEC4" });

// --- Hero_Console animation ---
const conTimeChunk = pushAnimData(consoleTimes);
const conTimeAcc = accessors.length;
accessors.push({ bufferView: conTimeChunk.bvIdx, componentType: 5126, count: consoleTimes.length, type: "SCALAR",
  min: [0], max: [1.5] });

const conHeadQuats = makeQuatTrack(QUAT_ID, QUAT_DOWN, QUAT_ID, QUAT_DOWN);
const conHeadChunk = pushAnimData(conHeadQuats);
const conHeadAcc = accessors.length;
accessors.push({ bufferView: conHeadChunk.bvIdx, componentType: 5126, count: 4, type: "VEC4" });

const animations = [
  {
    name: "Hero_Idle",
    channels: [
      { sampler: 0, target: { node: heroHead, path: "rotation" } },
      { sampler: 1, target: { node: heroHips, path: "translation" } },
    ],
    samplers: [
      { input: idleTimeAcc, interpolation: "LINEAR", output: idleHeadAcc },
      { input: idleTimeAcc, interpolation: "LINEAR", output: idleHipAcc },
    ],
  },
  {
    name: "Hero_Observe",
    channels: [
      { sampler: 0, target: { node: heroHead, path: "rotation" } },
    ],
    samplers: [
      { input: obsTimeAcc, interpolation: "LINEAR", output: obsHeadAcc },
    ],
  },
  {
    name: "Hero_Console",
    channels: [
      { sampler: 0, target: { node: heroHead, path: "rotation" } },
    ],
    samplers: [
      { input: conTimeAcc, interpolation: "LINEAR", output: conHeadAcc },
    ],
  },
];

// ---------------------------------------------------------------------------
// Assemble glTF JSON
// ---------------------------------------------------------------------------
const binaryBuffer = Buffer.concat(bufferChunks);

const json = {
  asset: {
    version: "2.0",
    generator: "OrgIntel Hero Character Generator C2A",
    extras: {
      title: "OrgIntel Hero Character — Afro-Futurist Architect Review Asset",
      pass: "C2A",
      purpose: "Review-only GLB. Load via ?hero=review or ?characters=review. Not live in production.",
      originAtFloor: true,
      heightSceneUnits: 1.80,
      facingAxis: "+Z (runtime applies rotationY=Math.PI)",
      triangleCountApprox: Math.round(triCount),
    },
  },
  scene: 0,
  scenes: [{ name: "HeroScene", nodes: [heroRoot] }],
  nodes,
  meshes,
  materials: gltfMaterials,
  accessors,
  bufferViews,
  buffers: [{ byteLength: binaryBuffer.byteLength }],
  animations,
};

// ---------------------------------------------------------------------------
// Build GLB
// ---------------------------------------------------------------------------
const jsonStr = JSON.stringify(json);
// JSON chunk must be 4-byte aligned (pad with spaces)
const jsonPadded = jsonStr.padEnd(Math.ceil(jsonStr.length / 4) * 4, " ");
const jsonBuf = Buffer.from(jsonPadded, "utf8");

const GLB_MAGIC = 0x46546C67;
const GLB_VERSION = 2;
const CHUNK_JSON = 0x4E4F534A;
const CHUNK_BIN  = 0x004E4942;

const jsonChunkLen = jsonBuf.byteLength;
const binChunkLen  = binaryBuffer.byteLength;
const totalLen = 12 + 8 + jsonChunkLen + 8 + binChunkLen;

const glb = Buffer.alloc(totalLen);
let o = 0;

// Header
glb.writeUInt32LE(GLB_MAGIC,   o); o += 4;
glb.writeUInt32LE(GLB_VERSION, o); o += 4;
glb.writeUInt32LE(totalLen,    o); o += 4;

// JSON chunk
glb.writeUInt32LE(jsonChunkLen, o); o += 4;
glb.writeUInt32LE(CHUNK_JSON,   o); o += 4;
jsonBuf.copy(glb, o); o += jsonChunkLen;

// BIN chunk
glb.writeUInt32LE(binChunkLen, o); o += 4;
glb.writeUInt32LE(CHUNK_BIN,   o); o += 4;
binaryBuffer.copy(glb, o);

await writeFile(output, glb);

const fileSizeMB = (glb.byteLength / 1024 / 1024).toFixed(3);
console.log(`✓ Written: ${output}`);
console.log(`  File size:     ${glb.byteLength} bytes (${fileSizeMB} MB)`);
console.log(`  Mesh parts:    ${parts.length}`);
console.log(`  Triangles:     ~${Math.round(triCount).toLocaleString()}`);
console.log(`  Nodes:         ${nodes.length}`);
console.log(`  Materials:     ${gltfMaterials.length}`);
console.log(`  Animations:    ${animations.length} (${animations.map(a => a.name).join(", ")})`);
console.log(`  Skeleton nodes: HERO_Root, HERO_Hips, HERO_Torso, HERO_Head,`);
console.log(`                  HERO_LeftArm, HERO_LeftForearm, HERO_LeftHand,`);
console.log(`                  HERO_RightArm, HERO_RightForearm, HERO_RightHand,`);
console.log(`                  HERO_LeftLeg, HERO_RightLeg`);
