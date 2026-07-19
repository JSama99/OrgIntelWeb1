import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(
  root,
  "public",
  "experience",
  "models",
  "orgintel-headquarters-atrium-graybox.glb",
);

const json = {
  asset: {
    version: "2.0",
    generator: "OrgIntel Atrium Graybox Generator 1.0",
    extras: {
      title: "OrgIntel Headquarters Atrium Environment — Graybox",
      unitMeters: 1,
      upAxis: "Y",
      forwardAxis: "-Z",
      purpose: "Scale, navigation, portal alignment, and production handoff",
      notFinalArt: true,
    },
  },
  scene: 0,
  scenes: [{ name: "OrgIntel Headquarters Atrium", nodes: [] }],
  nodes: [],
  meshes: [],
  materials: [],
  accessors: [],
  bufferViews: [],
  buffers: [],
};

const chunks = [];
let byteLength = 0;

function align4(value) {
  return (value + 3) & ~3;
}

function appendBytes(typedArray, target) {
  const source = Buffer.from(
    typedArray.buffer,
    typedArray.byteOffset,
    typedArray.byteLength,
  );
  const alignedOffset = align4(byteLength);
  if (alignedOffset > byteLength) chunks.push(Buffer.alloc(alignedOffset - byteLength));
  chunks.push(source);
  const bufferView = json.bufferViews.length;
  json.bufferViews.push({ buffer: 0, byteOffset: alignedOffset, byteLength: source.length, target });
  byteLength = alignedOffset + source.length;
  return bufferView;
}

function componentCount(type) {
  return { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type];
}

function addAccessor(typedArray, componentType, type, target, includeBounds = false) {
  const bufferView = appendBytes(typedArray, target);
  const count = typedArray.length / componentCount(type);
  const accessor = { bufferView, byteOffset: 0, componentType, count, type };
  if (includeBounds) {
    const width = componentCount(type);
    accessor.min = Array(width).fill(Infinity);
    accessor.max = Array(width).fill(-Infinity);
    for (let i = 0; i < typedArray.length; i += width) {
      for (let axis = 0; axis < width; axis += 1) {
        accessor.min[axis] = Math.min(accessor.min[axis], typedArray[i + axis]);
        accessor.max[axis] = Math.max(accessor.max[axis], typedArray[i + axis]);
      }
    }
  }
  const index = json.accessors.length;
  json.accessors.push(accessor);
  return index;
}

function registerGeometry(name, geometry) {
  return {
    name,
    position: addAccessor(new Float32Array(geometry.positions), 5126, "VEC3", 34962, true),
    normal: addAccessor(new Float32Array(geometry.normals), 5126, "VEC3", 34962),
    indices: addAccessor(new Uint16Array(geometry.indices), 5123, "SCALAR", 34963),
  };
}

function boxGeometry() {
  const positions = [];
  const normals = [];
  const indices = [];
  const faces = [
    [[1, 0, 0], [[.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]]],
    [[-1, 0, 0], [[-.5,-.5,.5],[-.5,-.5,-.5],[-.5,.5,-.5],[-.5,.5,.5]]],
    [[0, 1, 0], [[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]]],
    [[0, -1, 0], [[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]]],
    [[0, 0, 1], [[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,.5],[.5,.5,.5]]],
    [[0, 0, -1], [[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]]],
  ];
  faces.forEach(([normal, vertices]) => {
    const base = positions.length / 3;
    vertices.forEach((vertex) => {
      positions.push(...vertex);
      normals.push(...normal);
    });
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return { positions, normals, indices };
}

function cylinderGeometry(segments = 32) {
  const positions = [];
  const normals = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * .5;
    const z = Math.sin(angle) * .5;
    positions.push(x, -.5, z, x, .5, z);
    normals.push(Math.cos(angle), 0, Math.sin(angle), Math.cos(angle), 0, Math.sin(angle));
  }
  for (let i = 0; i < segments; i += 1) {
    const base = i * 2;
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const bottomCenter = positions.length / 3;
  positions.push(0, -.5, 0); normals.push(0, -1, 0);
  const topCenter = positions.length / 3;
  positions.push(0, .5, 0); normals.push(0, 1, 0);
  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    const a = (i / segments) * Math.PI * 2;
    const b = (next / segments) * Math.PI * 2;
    const bottomA = positions.length / 3;
    positions.push(Math.cos(a) * .5, -.5, Math.sin(a) * .5); normals.push(0, -1, 0);
    const bottomB = positions.length / 3;
    positions.push(Math.cos(b) * .5, -.5, Math.sin(b) * .5); normals.push(0, -1, 0);
    indices.push(bottomCenter, bottomB, bottomA);
    const topA = positions.length / 3;
    positions.push(Math.cos(a) * .5, .5, Math.sin(a) * .5); normals.push(0, 1, 0);
    const topB = positions.length / 3;
    positions.push(Math.cos(b) * .5, .5, Math.sin(b) * .5); normals.push(0, 1, 0);
    indices.push(topCenter, topA, topB);
  }
  return { positions, normals, indices };
}

function torusGeometry(majorSegments = 48, minorSegments = 10) {
  const positions = [];
  const normals = [];
  const indices = [];
  const majorRadius = .5;
  const minorRadius = .08;
  for (let u = 0; u <= majorSegments; u += 1) {
    const au = (u / majorSegments) * Math.PI * 2;
    for (let v = 0; v <= minorSegments; v += 1) {
      const av = (v / minorSegments) * Math.PI * 2;
      const radial = majorRadius + minorRadius * Math.cos(av);
      positions.push(radial * Math.cos(au), minorRadius * Math.sin(av), radial * Math.sin(au));
      normals.push(Math.cos(av) * Math.cos(au), Math.sin(av), Math.cos(av) * Math.sin(au));
    }
  }
  const stride = minorSegments + 1;
  for (let u = 0; u < majorSegments; u += 1) {
    for (let v = 0; v < minorSegments; v += 1) {
      const a = u * stride + v;
      const b = (u + 1) * stride + v;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, normals, indices };
}

function material(name, baseColor, metallic, roughness, emissive = [0, 0, 0], alphaMode) {
  const value = {
    name,
    pbrMetallicRoughness: { baseColorFactor: baseColor, metallicFactor: metallic, roughnessFactor: roughness },
    emissiveFactor: emissive,
  };
  if (alphaMode) {
    value.alphaMode = alphaMode;
    value.doubleSided = true;
  }
  json.materials.push(value);
  return json.materials.length - 1;
}

const materials = {
  floor: material("MAT_Floor_PolishedNavy", [0.018, 0.045, 0.075, 1], .86, .17),
  structure: material("MAT_Structure_BlueBlackMetal", [0.025, 0.065, 0.105, 1], .78, .27),
  secondary: material("MAT_Secondary_Gunmetal", [0.055, 0.095, 0.13, 1], .68, .32),
  glass: material("MAT_Glass_Graybox", [0.035, 0.18, 0.24, .24], .15, .08, [0.01, .06, .08], "BLEND"),
  teal: material("MAT_Emissive_Teal", [0.01, .3, .34, 1], .35, .24, [0.05, .8, .75]),
  gold: material("MAT_Emissive_Gold", [.55, .28, .06, 1], .64, .23, [1, .42, .08]),
  portal: material("MAT_Portal_Navy", [.025, .085, .14, 1], .72, .25, [0, .05, .08]),
};

const geometries = {
  box: registerGeometry("GEO_UnitBox", boxGeometry()),
  cylinder: registerGeometry("GEO_UnitCylinder32", cylinderGeometry()),
  torus: registerGeometry("GEO_UnitTorus", torusGeometry()),
};
const meshCache = new Map();

function meshFor(geometryName, materialIndex) {
  const key = `${geometryName}:${materialIndex}`;
  if (meshCache.has(key)) return meshCache.get(key);
  const geometry = geometries[geometryName];
  const index = json.meshes.length;
  json.meshes.push({
    name: `${geometry.name}_${json.materials[materialIndex].name}`,
    primitives: [{ attributes: { POSITION: geometry.position, NORMAL: geometry.normal }, indices: geometry.indices, material: materialIndex }],
  });
  meshCache.set(key, index);
  return index;
}

function quaternionY(radians = 0) {
  return [0, Math.sin(radians / 2), 0, Math.cos(radians / 2)];
}

function addNode(name, geometry, materialIndex, translation, scale, yaw = 0, extras) {
  const node = { name, mesh: meshFor(geometry, materialIndex), translation, scale };
  if (yaw) node.rotation = quaternionY(yaw);
  if (extras) node.extras = extras;
  const index = json.nodes.length;
  json.nodes.push(node);
  json.scenes[0].nodes.push(index);
  return index;
}

function addBox(name, materialIndex, translation, scale, yaw = 0, extras) {
  return addNode(name, "box", materialIndex, translation, scale, yaw, extras);
}

function addCylinder(name, materialIndex, translation, scale, extras) {
  return addNode(name, "cylinder", materialIndex, translation, scale, 0, extras);
}

function addPortal(id, label, position, yaw, accent) {
  const materialIndex = accent === "gold" ? materials.gold : materials.teal;
  const [x, y, z] = position;
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const local = (lx, lz) => [x + lx * cos + lz * sin, y, z - lx * sin + lz * cos];
  const left = local(-4.6, 0);
  const right = local(4.6, 0);
  addBox(`PORTAL_${id}_Left`, materials.portal, [left[0], 4.4, left[2]], [.75, 8.8, .9], yaw);
  addBox(`PORTAL_${id}_Right`, materials.portal, [right[0], 4.4, right[2]], [.75, 8.8, .9], yaw);
  addBox(`PORTAL_${id}_Header`, materials.portal, [x, 8.45, z], [9.9, .8, .9], yaw);
  addBox(`PORTAL_${id}_LightLeft`, materialIndex, [left[0], 4.4, left[2]], [.12, 7.5, 1.02], yaw);
  addBox(`PORTAL_${id}_LightRight`, materialIndex, [right[0], 4.4, right[2]], [.12, 7.5, 1.02], yaw);
  addBox(`PORTAL_${id}_Sign`, materialIndex, [x, 8.45, z], [6.4, .16, 1.05], yaw, { roomId: id, roomLabel: label, signageReserved: true });
}

// Primary architectural shell — 140 m × 150 m × 24 m.
addBox("ATRIUM_Floor", materials.floor, [0, -.18, -6], [140, .36, 150], 0, { walkable: true });
addBox("ATRIUM_BackWall", materials.structure, [0, 10, -79], [140, 20, 1.2]);
addBox("ATRIUM_LeftWall", materials.structure, [-69.4, 10, -7], [1.2, 20, 144]);
addBox("ATRIUM_RightWall", materials.structure, [69.4, 10, -7], [1.2, 20, 144]);

// Multi-level balconies and glass rails.
addBox("BALCONY_Left_Deck", materials.secondary, [-59, 8.8, -8], [18, .65, 130]);
addBox("BALCONY_Right_Deck", materials.secondary, [59, 8.8, -8], [18, .65, 130]);
addBox("BALCONY_Back_Deck", materials.secondary, [0, 8.8, -72], [102, .65, 13]);
addBox("BALCONY_Left_GlassRail", materials.glass, [-49.8, 10.2, -8], [.18, 2.2, 128]);
addBox("BALCONY_Right_GlassRail", materials.glass, [49.8, 10.2, -8], [.18, 2.2, 128]);
addBox("BALCONY_Back_GlassRail", materials.glass, [0, 10.2, -65.2], [98, 2.2, .18]);

// Structural rhythm and integrated light strips.
let column = 0;
for (const x of [-65, 65]) {
  for (let z = -68; z <= 52; z += 15) {
    column += 1;
    addBox(`STRUCT_Column_${String(column).padStart(2, "0")}`, materials.structure, [x, 10, z], [1.5, 20, 1.5]);
    addBox(`LIGHT_Column_${String(column).padStart(2, "0")}`, column % 3 === 0 ? materials.gold : materials.teal, [x * .987, 10, z], [.12, 16, 1.62]);
  }
}
for (let x = -52; x <= 52; x += 13) {
  column += 1;
  addBox(`STRUCT_Column_${String(column).padStart(2, "0")}`, materials.structure, [x, 10, -76.5], [1.4, 20, 1.4]);
}

// Ceiling frame and central architectural rings.
addBox("CEILING_Spine", materials.secondary, [0, 20.2, -7], [2, .7, 142]);
for (const x of [-48, -24, 24, 48]) addBox(`CEILING_Beam_${x}`, materials.secondary, [x, 20.2, -7], [1.1, .7, 142]);
addNode("CEILING_CoreRing_Outer", "torus", materials.teal, [0, 20, 8], [28, 2.4, 28]);
addNode("CEILING_CoreRing_Inner", "torus", materials.gold, [0, 19.85, 8], [18, 1.5, 18]);

// Intelligence Core reserve and ceremonial dais.
addCylinder("CORE_Dais_Lower", materials.structure, [0, .22, 8], [15, .44, 15], { coreReserve: true });
addCylinder("CORE_Dais_Upper", materials.secondary, [0, .55, 8], [10.5, .65, 10.5]);
addNode("CORE_FloorRing_Outer", "torus", materials.teal, [0, .92, 8], [20, 1.7, 20]);
addNode("CORE_FloorRing_Inner", "torus", materials.gold, [0, .94, 8], [12, 1.1, 12]);

// Navigation paths preserve the existing headquarters station coordinates.
addBox("PATH_Memory", materials.teal, [-27, .025, 5], [38, .05, .22], -Math.PI / 2);
addBox("PATH_Observatory", materials.teal, [27, .025, 5], [38, .05, .22], Math.PI / 2);
addBox("PATH_Decision", materials.teal, [-17, .025, -27], [52, .05, .22], Math.PI / 4);
addBox("PATH_Proof", materials.gold, [17, .027, -27], [52, .055, .22], -Math.PI / 4);
addBox("PATH_Console", materials.teal, [0, .025, -34], [.22, .05, 74]);

// Room entrances align with the existing room progression.
addPortal("MemoryArchive", "Memory Archive", [-62, 0, 0], Math.PI / 2, "teal");
addPortal("DecisionChamber", "Decision Chamber", [-31, 0, -70], 0, "teal");
addPortal("ProofVault", "Proof Vault", [31, 0, -70], 0, "gold");
addPortal("IntelligenceObservatory", "Intelligence Observatory", [62, 0, 0], -Math.PI / 2, "teal");
addPortal("OperationalConsole", "Operational Console", [0, 0, -76], 0, "gold");

// Low-detail furnishing proxies establish scale for the production artist.
for (const side of [-1, 1]) {
  for (let z = -48; z <= 38; z += 22) {
    addCylinder(`PROP_Planter_${side}_${z}`, materials.secondary, [side * 43, .75, z], [3.1, 1.5, 3.1], { replaceWithProductionProp: true });
    addCylinder(`PROP_PlantCanopy_${side}_${z}`, materials.teal, [side * 43, 2.4, z], [2.4, 2.2, 2.4], { replaceWithProductionFoliage: true });
  }
}

const binary = Buffer.concat(chunks);
const binaryPadding = align4(binary.length) - binary.length;
const paddedBinary = binaryPadding ? Buffer.concat([binary, Buffer.alloc(binaryPadding)]) : binary;
json.buffers.push({ byteLength: paddedBinary.length });

let jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
const jsonPadding = align4(jsonBuffer.length) - jsonBuffer.length;
if (jsonPadding) jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);

const totalLength = 12 + 8 + jsonBuffer.length + 8 + paddedBinary.length;
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(totalLength, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(jsonBuffer.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(paddedBinary.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, Buffer.concat([header, jsonHeader, jsonBuffer, binHeader, paddedBinary]));
console.log(`Wrote ${output}`);
console.log(`Nodes: ${json.nodes.length}, meshes: ${json.meshes.length}, materials: ${json.materials.length}`);
console.log(`GLB size: ${totalLength} bytes`);
