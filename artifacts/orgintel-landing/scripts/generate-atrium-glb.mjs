import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pass3Review = process.argv.includes("--pass3-review");
const output = path.join(
  root,
  "public",
  "experience",
  "models",
  pass3Review
    ? "orgintel-headquarters-atrium-pass3-review.glb"
    : "orgintel-headquarters-atrium-production.glb",
);
const textureDirectory = path.join(
  root,
  "public",
  "experience",
  "models",
  "textures",
);
const materialAtlas = path.join(textureDirectory, "atrium-material-atlas.png");
const normalAtlas = path.join(textureDirectory, "atrium-normal-atlas.png");
const ormAtlas = path.join(textureDirectory, "atrium-orm-atlas.png");

const json = {
  asset: {
    version: "2.0",
    generator: `OrgIntel Atrium Production Generator ${pass3Review ? "4.0-review" : "3.0"}`,
    extras: {
      title: `OrgIntel Headquarters Atrium Environment — Realism Pass ${pass3Review ? 3 : 2}`,
      unitMeters: 1,
      upAxis: "Y",
      forwardAxis: "-Z",
      purpose: pass3Review
        ? "Isolated review asset for normal and occlusion/roughness/metallic surface maps"
        : "Detailed architecture, authored surface atlas, PBR materials, navigation, and visual review",
      productionPass: pass3Review ? 3 : 2,
      liveIntegrationApproved: !pass3Review,
      ...(pass3Review
        ? {
            textureProfile: "base-color + tangent-space normal + ORM",
            liveProductionAssetUnchanged: true,
          }
        : {}),
    },
  },
  extensionsUsed: [
    "KHR_materials_clearcoat",
    "KHR_materials_emissive_strength",
    "KHR_materials_ior",
    "KHR_materials_transmission",
    "KHR_texture_transform",
    "KHR_lights_punctual",
  ],
  extensions: { KHR_lights_punctual: { lights: [] } },
  scene: 0,
  scenes: [{ name: "OrgIntel Headquarters Atrium", nodes: [] }],
  nodes: [],
  meshes: [],
  materials: [],
  images: [],
  samplers: [{ name: "SAMPLER_AtlasClamp", magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
  textures: [
    { name: "TEX_OrgIntelAtriumMaterialAtlas", sampler: 0, source: 0 },
    ...(pass3Review
      ? [
          { name: "TEX_OrgIntelAtriumNormalAtlas", sampler: 0, source: 1 },
          { name: "TEX_OrgIntelAtriumORMAtlas", sampler: 0, source: 2 },
        ]
      : []),
  ],
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

function tangentGeometry(geometry) {
  const vertexCount = geometry.positions.length / 3;
  const tangentU = Array.from({ length: vertexCount }, () => [0, 0, 0]);
  const tangentV = Array.from({ length: vertexCount }, () => [0, 0, 0]);
  const add = (target, x, y, z) => {
    target[0] += x;
    target[1] += y;
    target[2] += z;
  };

  for (let index = 0; index < geometry.indices.length; index += 3) {
    const i0 = geometry.indices[index];
    const i1 = geometry.indices[index + 1];
    const i2 = geometry.indices[index + 2];
    const p0 = geometry.positions.slice(i0 * 3, i0 * 3 + 3);
    const p1 = geometry.positions.slice(i1 * 3, i1 * 3 + 3);
    const p2 = geometry.positions.slice(i2 * 3, i2 * 3 + 3);
    const uv0 = geometry.uvs.slice(i0 * 2, i0 * 2 + 2);
    const uv1 = geometry.uvs.slice(i1 * 2, i1 * 2 + 2);
    const uv2 = geometry.uvs.slice(i2 * 2, i2 * 2 + 2);
    const edge1 = p1.map((value, axis) => value - p0[axis]);
    const edge2 = p2.map((value, axis) => value - p0[axis]);
    const du1 = uv1[0] - uv0[0];
    const dv1 = uv1[1] - uv0[1];
    const du2 = uv2[0] - uv0[0];
    const dv2 = uv2[1] - uv0[1];
    const determinant = du1 * dv2 - du2 * dv1;
    if (Math.abs(determinant) < 1e-8) continue;
    const reciprocal = 1 / determinant;
    const u = edge1.map((value, axis) => (value * dv2 - edge2[axis] * dv1) * reciprocal);
    const v = edge1.map((value, axis) => (edge2[axis] * du1 - value * du2) * reciprocal);
    for (const vertex of [i0, i1, i2]) {
      add(tangentU[vertex], ...u);
      add(tangentV[vertex], ...v);
    }
  }

  const tangents = [];
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const normal = geometry.normals.slice(vertex * 3, vertex * 3 + 3);
    const source = tangentU[vertex];
    const projection = normal[0] * source[0] + normal[1] * source[1] + normal[2] * source[2];
    const tangent = source.map((value, axis) => value - normal[axis] * projection);
    const length = Math.hypot(...tangent);
    const normalized = length > 1e-8
      ? tangent.map((value) => value / length)
      : Math.abs(normal[1]) < .999 ? [normal[2], 0, -normal[0]] : [1, 0, 0];
    const cross = [
      normal[1] * normalized[2] - normal[2] * normalized[1],
      normal[2] * normalized[0] - normal[0] * normalized[2],
      normal[0] * normalized[1] - normal[1] * normalized[0],
    ];
    const handedness = cross[0] * tangentV[vertex][0]
      + cross[1] * tangentV[vertex][1]
      + cross[2] * tangentV[vertex][2] < 0 ? -1 : 1;
    tangents.push(...normalized, handedness);
  }
  return tangents;
}

function registerGeometry(name, geometry, includeUv = true) {
  return {
    name,
    position: addAccessor(new Float32Array(geometry.positions), 5126, "VEC3", 34962, true),
    normal: addAccessor(new Float32Array(geometry.normals), 5126, "VEC3", 34962),
    uv: includeUv ? addAccessor(new Float32Array(geometry.uvs), 5126, "VEC2", 34962) : undefined,
    tangent: pass3Review && includeUv
      ? addAccessor(new Float32Array(tangentGeometry(geometry)), 5126, "VEC4", 34962)
      : undefined,
    indices: addAccessor(new Uint16Array(geometry.indices), 5123, "SCALAR", 34963),
  };
}

function boxGeometry() {
  const positions = [];
  const normals = [];
  const uvs = [];
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
    uvs.push(0, 1, 1, 1, 1, 0, 0, 0);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return { positions, normals, uvs, indices };
}

function cylinderGeometry(segments = 32) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * .5;
    const z = Math.sin(angle) * .5;
    positions.push(x, -.5, z, x, .5, z);
    normals.push(Math.cos(angle), 0, Math.sin(angle), Math.cos(angle), 0, Math.sin(angle));
    uvs.push(i / segments, 1, i / segments, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    const base = i * 2;
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const bottomCenter = positions.length / 3;
  positions.push(0, -.5, 0); normals.push(0, -1, 0); uvs.push(.5, .5);
  const topCenter = positions.length / 3;
  positions.push(0, .5, 0); normals.push(0, 1, 0); uvs.push(.5, .5);
  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    const a = (i / segments) * Math.PI * 2;
    const b = (next / segments) * Math.PI * 2;
    const bottomA = positions.length / 3;
    positions.push(Math.cos(a) * .5, -.5, Math.sin(a) * .5); normals.push(0, -1, 0); uvs.push(.5 + Math.cos(a) * .5, .5 + Math.sin(a) * .5);
    const bottomB = positions.length / 3;
    positions.push(Math.cos(b) * .5, -.5, Math.sin(b) * .5); normals.push(0, -1, 0); uvs.push(.5 + Math.cos(b) * .5, .5 + Math.sin(b) * .5);
    indices.push(bottomCenter, bottomB, bottomA);
    const topA = positions.length / 3;
    positions.push(Math.cos(a) * .5, .5, Math.sin(a) * .5); normals.push(0, 1, 0); uvs.push(.5 + Math.cos(a) * .5, .5 + Math.sin(a) * .5);
    const topB = positions.length / 3;
    positions.push(Math.cos(b) * .5, .5, Math.sin(b) * .5); normals.push(0, 1, 0); uvs.push(.5 + Math.cos(b) * .5, .5 + Math.sin(b) * .5);
    indices.push(topCenter, topA, topB);
  }
  return { positions, normals, uvs, indices };
}

function torusGeometry(majorSegments = 48, minorSegments = 10) {
  const positions = [];
  const normals = [];
  const uvs = [];
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
      uvs.push(u / majorSegments, v / minorSegments);
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
  return { positions, normals, uvs, indices };
}

function atlasTextureInfo(index, atlas, extras = {}) {
  return {
    index,
    texCoord: 0,
    ...extras,
    extensions: {
      KHR_texture_transform: {
        offset: atlas.offset,
        scale: atlas.scale,
      },
    },
  };
}

function material(name, baseColor, metallic, roughness, emissive = [0, 0, 0], options = {}) {
  const value = {
    name,
    pbrMetallicRoughness: { baseColorFactor: baseColor, metallicFactor: metallic, roughnessFactor: roughness },
    emissiveFactor: emissive,
  };
  if (options.atlas) {
    value.pbrMetallicRoughness.baseColorTexture = atlasTextureInfo(0, options.atlas);
    if (pass3Review) {
      value.normalTexture = atlasTextureInfo(1, options.atlas, {
        scale: options.normalScale ?? .35,
      });
      value.pbrMetallicRoughness.metallicRoughnessTexture = atlasTextureInfo(2, options.atlas);
      value.occlusionTexture = atlasTextureInfo(2, options.atlas, {
        strength: options.occlusionStrength ?? .65,
      });
    }
  }
  if (options.alphaMode) {
    value.alphaMode = options.alphaMode;
    value.doubleSided = true;
  }
  if (options.clearcoat) {
    value.extensions ??= {};
    value.extensions.KHR_materials_clearcoat = {
      clearcoatFactor: options.clearcoat,
      clearcoatRoughnessFactor: options.clearcoatRoughness ?? .16,
    };
  }
  if (options.transmission) {
    value.extensions ??= {};
    value.extensions.KHR_materials_transmission = { transmissionFactor: options.transmission };
    value.extensions.KHR_materials_ior = { ior: options.ior ?? 1.5 };
  }
  if (options.emissiveStrength) {
    value.extensions ??= {};
    value.extensions.KHR_materials_emissive_strength = { emissiveStrength: options.emissiveStrength };
  }
  json.materials.push(value);
  return json.materials.length - 1;
}

const materials = {
  floor: material("MAT_Floor_PolishedNavy", [.72, .82, .96, 1], .78, .13, [0, 0, 0], { clearcoat: .72, clearcoatRoughness: .09, normalScale: .22, occlusionStrength: .42, atlas: { offset: [.002, .002], scale: [.496, .496] } }),
  structure: material("MAT_Structure_BlueBlackMetal", [0.025, 0.065, 0.105, 1], .78, .27),
  secondary: material("MAT_Secondary_Gunmetal", [0.055, 0.095, 0.13, 1], .68, .32),
  blackMetal: material("MAT_BlackenedSteel", [.62, .68, .76, 1], .92, .2, [0, 0, 0], { normalScale: .3, occlusionStrength: .5, atlas: { offset: [.502, .502], scale: [.496, .496] } }),
  brushedMetal: material("MAT_BrushedTitanium", [.78, .82, .86, 1], .88, .24, [0, 0, 0], { normalScale: .46, occlusionStrength: .38, atlas: { offset: [.002, .502], scale: [.496, .496] } }),
  wallStone: material("MAT_Wall_CharcoalStone", [.58, .6, .64, 1], .12, .58, [0, 0, 0], { normalScale: .58, occlusionStrength: .78, atlas: { offset: [.502, .002], scale: [.496, .496] } }),
  glass: material("MAT_Glass_Architectural", [0.018, .09, .12, .3], .05, .06, [0, .018, .025], { alphaMode: "BLEND", transmission: .82, ior: 1.48, clearcoat: .85, clearcoatRoughness: .04 }),
  glassFrosted: material("MAT_Glass_Frosted", [.055, .14, .17, .58], .03, .38, [0, .012, .018], { alphaMode: "BLEND", transmission: .32, ior: 1.46 }),
  teal: material("MAT_Emissive_Teal", [0.005, .16, .19, 1], .28, .19, [0.02, .62, .72], { emissiveStrength: 4.2 }),
  gold: material("MAT_Emissive_Gold", [.38, .17, .025, 1], .58, .2, [.9, .3, .035], { emissiveStrength: 3.4 }),
  warm: material("MAT_Emissive_InteriorWarm", [.2, .105, .035, 1], .12, .42, [.85, .34, .08], { emissiveStrength: 2.2 }),
  display: material("MAT_Display_BlueBlack", [.006, .035, .055, 1], .38, .18, [.01, .12, .19], { emissiveStrength: 1.8, clearcoat: .4 }),
  upholstery: material("MAT_Upholstery_DeepTeal", [.018, .095, .105, 1], .02, .76),
  foliage: material("MAT_Foliage_DeepGreen", [.012, .11, .08, 1], .01, .72),
  portal: material("MAT_Portal_Navy", [.025, .085, .14, 1], .72, .25, [0, .05, .08]),
};

const geometries = {
  box: registerGeometry("GEO_UnitBox", boxGeometry()),
  cylinder: registerGeometry("GEO_UnitCylinder32", cylinderGeometry()),
  torus: registerGeometry("GEO_UnitTorus", torusGeometry(), false),
};
const meshCache = new Map();

function meshFor(geometryName, materialIndex) {
  const key = `${geometryName}:${materialIndex}`;
  if (meshCache.has(key)) return meshCache.get(key);
  const geometry = geometries[geometryName];
  const attributes = { POSITION: geometry.position, NORMAL: geometry.normal };
  if (
    json.materials[materialIndex].pbrMetallicRoughness.baseColorTexture
    || json.materials[materialIndex].normalTexture
    || json.materials[materialIndex].occlusionTexture
  ) {
    attributes.TEXCOORD_0 = geometry.uv;
  }
  if (json.materials[materialIndex].normalTexture) attributes.TANGENT = geometry.tangent;
  const index = json.meshes.length;
  json.meshes.push({
    name: `${geometry.name}_${json.materials[materialIndex].name}`,
    primitives: [{ attributes, indices: geometry.indices, material: materialIndex }],
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

function addPointLight(name, color, intensity, range, translation) {
  const lightIndex = json.extensions.KHR_lights_punctual.lights.length;
  json.extensions.KHR_lights_punctual.lights.push({ name, type: "point", color, intensity, range });
  const nodeIndex = json.nodes.length;
  json.nodes.push({
    name: `LIGHTNODE_${name}`,
    translation,
    extensions: { KHR_lights_punctual: { light: lightIndex } },
    extras: { castsShadow: false, qualityTier: "desktop-and-mobile" },
  });
  json.scenes[0].nodes.push(nodeIndex);
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
  addBox(`PORTAL_${id}_Recess`, materials.blackMetal, [x, 4.1, z], [8.2, 7.2, .42], yaw);
  addBox(`PORTAL_${id}_Glass`, materials.glassFrosted, [x, 4.05, z], [7.5, 6.7, .24], yaw);
  addBox(`PORTAL_${id}_Threshold`, materials.brushedMetal, [x, .1, z], [10.4, .2, 2.4], yaw);
  for (const rib of [-3.4, 0, 3.4]) {
    const point = local(rib, .28);
    addBox(`PORTAL_${id}_Rib_${rib}`, materials.brushedMetal, [point[0], 4.1, point[2]], [.09, 7.1, .22], yaw);
  }
}

function addStairFlight(id, origin, direction = 1) {
  const [x, y, z] = origin;
  const steps = 18;
  for (let step = 0; step < steps; step += 1) {
    const rise = (step + 1) * .36;
    const run = step * .66 * direction;
    addBox(`STAIR_${id}_Step_${String(step + 1).padStart(2, "0")}`, materials.wallStone, [x, y + rise / 2, z + run], [7.2, rise, .72]);
  }
  addBox(`STAIR_${id}_RailLeft`, materials.brushedMetal, [x - 3.5, y + 3.7, z + 5.6 * direction], [.09, 1.1, 12], 0);
  addBox(`STAIR_${id}_RailRight`, materials.brushedMetal, [x + 3.5, y + 3.7, z + 5.6 * direction], [.09, 1.1, 12], 0);
}

function addOfficeBay(id, x, y, z, yaw = 0) {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const local = (lx, lz) => [x + lx * cos + lz * sin, z - lx * sin + lz * cos];
  const glass = local(0, 0);
  const ceiling = local(0, .8);
  const light = local(0, 1.1);
  const desk = local(0, 1.4);
  const display = local(0, 2.1);
  addBox(`OFFICE_${id}_Glass`, materials.glass, [glass[0], y + 2.1, glass[1]], [10.5, 4.1, .16], yaw);
  addBox(`OFFICE_${id}_Ceiling`, materials.wallStone, [ceiling[0], y + 4.35, ceiling[1]], [10.8, .22, 4.6], yaw);
  addBox(`OFFICE_${id}_WarmLight`, materials.warm, [light[0], y + 4.18, light[1]], [6.8, .045, 1.4], yaw);
  for (const mullion of [-5.2, 0, 5.2]) {
    const point = local(mullion, -.05);
    addBox(`OFFICE_${id}_Mullion_${mullion}`, materials.blackMetal, [point[0], y + 2.1, point[1]], [.1, 4.3, .22], yaw);
  }
  addBox(`OFFICE_${id}_Desk`, materials.secondary, [desk[0], y + .8, desk[1]], [4.8, .16, 1.4], yaw);
  addBox(`OFFICE_${id}_Display`, materials.display, [display[0], y + 2.25, display[1]], [3.6, 1.65, .08], yaw);
}

// Primary architectural shell — 140 m × 150 m × 24 m.
addBox("ATRIUM_Floor", materials.floor, [0, -.18, -6], [140, .36, 150], 0, { walkable: true });
addBox("ATRIUM_BackWall", materials.wallStone, [0, 10, -79], [140, 20, 1.2]);
addBox("ATRIUM_LeftWall", materials.wallStone, [-69.4, 10, -7], [1.2, 20, 144]);
addBox("ATRIUM_RightWall", materials.wallStone, [69.4, 10, -7], [1.2, 20, 144]);

// Floor panels and inlays break up the broad polished surface without affecting collision.
for (let x = -54; x <= 54; x += 18) {
  addBox(`FLOOR_Inlay_X_${x}`, materials.brushedMetal, [x, .012, -5], [.055, .025, 126]);
}
for (let z = -58; z <= 50; z += 18) {
  addBox(`FLOOR_Inlay_Z_${z}`, materials.brushedMetal, [0, .014, z], [118, .028, .055]);
}

// Two occupied balcony levels with glass rails and visible office depth.
for (const [level, y] of [[1, 6.8], [2, 13.2]]) {
  addBox(`BALCONY_L${level}_Left_Deck`, materials.secondary, [-59, y, -8], [18, .65, 130]);
  addBox(`BALCONY_L${level}_Right_Deck`, materials.secondary, [59, y, -8], [18, .65, 130]);
  addBox(`BALCONY_L${level}_Back_Deck`, materials.secondary, [0, y, -72], [102, .65, 13]);
  addBox(`BALCONY_L${level}_Left_GlassRail`, materials.glass, [-49.8, y + 1.35, -8], [.18, 2.15, 128]);
  addBox(`BALCONY_L${level}_Right_GlassRail`, materials.glass, [49.8, y + 1.35, -8], [.18, 2.15, 128]);
  addBox(`BALCONY_L${level}_Back_GlassRail`, materials.glass, [0, y + 1.35, -65.2], [98, 2.15, .18]);
  for (const side of [-1, 1]) {
    for (let bay = 0, z = -54; z <= 36; z += 18, bay += 1) addOfficeBay(`L${level}_${side < 0 ? "L" : "R"}_${bay}`, side * 64.4, y + .35, z, side < 0 ? Math.PI / 2 : -Math.PI / 2);
  }
}

addStairFlight("NorthWest", [-40, 0, -58], 1);
addStairFlight("NorthEast", [40, 0, -58], 1);

// Structural rhythm and integrated light strips.
let column = 0;
for (const x of [-65, 65]) {
  for (let z = -68; z <= 52; z += 15) {
    column += 1;
    addBox(`STRUCT_Column_${String(column).padStart(2, "0")}`, materials.structure, [x, 10, z], [1.5, 20, 1.5]);
    addBox(`STRUCT_ColumnBase_${String(column).padStart(2, "0")}`, materials.brushedMetal, [x, .42, z], [2.25, .84, 2.25]);
    addBox(`STRUCT_ColumnCap_${String(column).padStart(2, "0")}`, materials.brushedMetal, [x, 19.25, z], [2.2, .5, 2.2]);
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
for (let x = -48; x <= 48; x += 24) {
  for (let z = -52; z <= 44; z += 24) {
    addBox(`CEILING_Coffer_${x}_${z}`, materials.blackMetal, [x, 20.35, z], [18, .3, 16]);
    addBox(`CEILING_Practical_${x}_${z}`, (x + z) % 48 === 0 ? materials.warm : materials.teal, [x, 20.12, z], [8.5, .055, .18]);
  }
}

// Intelligence Core reserve and ceremonial dais.
addCylinder("CORE_Dais_Lower", materials.structure, [0, .22, 8], [15, .44, 15], { coreReserve: true });
addCylinder("CORE_Dais_Upper", materials.secondary, [0, .55, 8], [10.5, .65, 10.5]);
addNode("CORE_FloorRing_Outer", "torus", materials.teal, [0, .92, 8], [20, 1.7, 20]);
addNode("CORE_FloorRing_Inner", "torus", materials.gold, [0, .94, 8], [12, 1.1, 12]);
addCylinder("CORE_HologramPlinth", materials.blackMetal, [0, 1.2, 8], [4.2, 1.7, 4.2], { coreReserve: true });
addCylinder("CORE_HologramEmitter", materials.teal, [0, 2.15, 8], [3.1, .16, 3.1], { coreReserve: true });
for (let pylon = 0; pylon < 8; pylon += 1) {
  const angle = pylon / 8 * Math.PI * 2;
  const x = Math.cos(angle) * 11.8;
  const z = 8 + Math.sin(angle) * 11.8;
  addBox(`CORE_Pylon_${pylon + 1}`, materials.blackMetal, [x, 2.2, z], [.7, 3.9, .7], -angle);
  addBox(`CORE_PylonLight_${pylon + 1}`, pylon % 3 === 0 ? materials.gold : materials.teal, [x, 3.3, z], [.78, 1.15, .12], -angle);
}

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

// Production dressing establishes human scale and richer silhouettes.
for (const side of [-1, 1]) {
  for (let z = -48; z <= 38; z += 22) {
    addCylinder(`PROP_Planter_${side}_${z}`, materials.brushedMetal, [side * 43, .7, z], [3.1, 1.4, 3.1]);
    addCylinder(`PROP_PlantTrunk_${side}_${z}`, materials.wallStone, [side * 43, 2.1, z], [.42, 2.8, .42]);
    addCylinder(`PROP_PlantCanopy_${side}_${z}`, materials.foliage, [side * 43, 3.7, z], [2.7, 2.5, 2.7], { foliageLodRequired: true });
    addBox(`PROP_BenchSeat_${side}_${z}`, materials.upholstery, [side * 37, .72, z], [5.4, .55, 1.4]);
    addBox(`PROP_BenchBase_${side}_${z}`, materials.blackMetal, [side * 37, .35, z], [4.8, .42, 1.15]);
  }
}

for (const [id, x, z, yaw] of [
  ["Memory", -24, 34, Math.PI / 2],
  ["Observatory", 24, 34, -Math.PI / 2],
  ["Decision", -24, -34, Math.PI / 4],
  ["Proof", 24, -34, -Math.PI / 4],
]) {
  addBox(`KIOSK_${id}_Body`, materials.blackMetal, [x, 1.35, z], [2.2, 2.7, 1.1], yaw);
  addBox(`KIOSK_${id}_Display`, materials.display, [x, 2.0, z], [1.75, 1.05, 1.16], yaw, { interactiveReserved: true });
  addBox(`KIOSK_${id}_Accent`, id === "Proof" ? materials.gold : materials.teal, [x, .32, z], [2.35, .08, 1.3], yaw);
}

// Bounded practical lights give reflective materials spatial response without shadow cost.
addPointLight("CoreTeal", [.02, .7, .9], 185, 30, [0, 7.5, 8]);
addPointLight("CoreGold", [1, .34, .06], 105, 20, [0, 3.2, 8]);
for (const side of [-1, 1]) {
  for (const z of [-42, -8, 26]) {
    addPointLight(`OfficeWarm_${side}_${z}`, [1, .42, .14], 72, 16, [side * 48, 9.2, z]);
  }
}
addPointLight("ConsolePortalGold", [1, .3, .055], 92, 18, [0, 7, -67]);

const atlasBytes = await readFile(materialAtlas);
const atlasBufferView = appendBytes(atlasBytes);
json.images.push({
  name: "IMG_OrgIntelAtriumMaterialAtlas",
  mimeType: "image/png",
  bufferView: atlasBufferView,
});

if (pass3Review) {
  let normalBytes;
  let ormBytes;
  try {
    [normalBytes, ormBytes] = await Promise.all([
      readFile(normalAtlas),
      readFile(ormAtlas),
    ]);
  } catch (error) {
    throw new Error(
      `Pass 3 review generation requires ${path.basename(normalAtlas)} and ${path.basename(ormAtlas)}. `
      + "The live Pass 2 GLB was not modified.",
      { cause: error },
    );
  }
  const normalBufferView = appendBytes(normalBytes);
  json.images.push({
    name: "IMG_OrgIntelAtriumNormalAtlas",
    mimeType: "image/png",
    bufferView: normalBufferView,
  });
  const ormBufferView = appendBytes(ormBytes);
  json.images.push({
    name: "IMG_OrgIntelAtriumORMAtlas",
    mimeType: "image/png",
    bufferView: ormBufferView,
  });
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
