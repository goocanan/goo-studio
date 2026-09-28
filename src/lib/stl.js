// Lightweight STL parser (binary + ASCII) for the browser.
// Computes: triangle count, solid volume (mm^3) and bounding box (mm).
// Volume uses the signed-tetrahedron (divergence) method, valid for
// watertight meshes. Units are assumed to be millimetres (STL has none).

function looksBinary(arrayBuffer) {
  if (arrayBuffer.byteLength < 84) return false;
  const view = new DataView(arrayBuffer);
  const triCount = view.getUint32(80, true);
  if (84 + triCount * 50 === arrayBuffer.byteLength) return true;
  // Fallback: binary files may start with "solid" too, so only trust ASCII
  // when the header clearly is not a facet stream.
  const header = new TextDecoder().decode(
    new Uint8Array(arrayBuffer, 0, Math.min(80, arrayBuffer.byteLength))
  );
  return !/^\s*solid/i.test(header);
}

function emptyBBox() {
  return {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };
}

function extendBBox(bbox, x, y, z) {
  if (x < bbox.min[0]) bbox.min[0] = x;
  if (y < bbox.min[1]) bbox.min[1] = y;
  if (z < bbox.min[2]) bbox.min[2] = z;
  if (x > bbox.max[0]) bbox.max[0] = x;
  if (y > bbox.max[1]) bbox.max[1] = y;
  if (z > bbox.max[2]) bbox.max[2] = z;
}

function finalizeBBox(bbox) {
  if (!isFinite(bbox.min[0])) {
    return { min: [0, 0, 0], max: [0, 0, 0], size: [0, 0, 0] };
  }
  return {
    min: bbox.min,
    max: bbox.max,
    size: [
      bbox.max[0] - bbox.min[0],
      bbox.max[1] - bbox.min[1],
      bbox.max[2] - bbox.min[2],
    ],
  };
}

function parseBinary(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const declared = view.getUint32(80, true);
  const available = Math.floor((arrayBuffer.byteLength - 84) / 50);
  const count = Math.min(declared, Math.max(0, available));

  let volume = 0;
  const bbox = emptyBBox();
  let offset = 84;

  for (let i = 0; i < count; i++) {
    const base = offset + 12; // skip the 12-byte normal vector
    const ax = view.getFloat32(base, true);
    const ay = view.getFloat32(base + 4, true);
    const az = view.getFloat32(base + 8, true);
    const bx = view.getFloat32(base + 12, true);
    const by = view.getFloat32(base + 16, true);
    const bz = view.getFloat32(base + 20, true);
    const cx = view.getFloat32(base + 24, true);
    const cy = view.getFloat32(base + 28, true);
    const cz = view.getFloat32(base + 32, true);

    volume +=
      (ax * (by * cz - bz * cy) -
        ay * (bx * cz - bz * cx) +
        az * (bx * cy - by * cx)) / 6;

    extendBBox(bbox, ax, ay, az);
    extendBBox(bbox, bx, by, bz);
    extendBBox(bbox, cx, cy, cz);

    offset += 50;
  }

  return {
    format: 'binary',
    triangles: count,
    volumeMm3: Math.abs(volume),
    bbox: finalizeBBox(bbox),
  };
}

function parseASCII(text) {
  const re = /vertex\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)\s+(-?[\d.eE+]+)/g;
  const verts = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    verts.push([parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
  }

  let volume = 0;
  const bbox = emptyBBox();
  const triangles = Math.floor(verts.length / 3);

  for (let i = 0; i + 2 < verts.length; i += 3) {
    const a = verts[i];
    const b = verts[i + 1];
    const c = verts[i + 2];

    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;

    extendBBox(bbox, a[0], a[1], a[2]);
    extendBBox(bbox, b[0], b[1], b[2]);
    extendBBox(bbox, c[0], c[1], c[2]);
  }

  return {
    format: 'ascii',
    triangles,
    volumeMm3: Math.abs(volume),
    bbox: finalizeBBox(bbox),
  };
}

/**
 * Parse an STL ArrayBuffer and return geometry metrics.
 */
export function parseSTL(arrayBuffer) {
  if (looksBinary(arrayBuffer)) return parseBinary(arrayBuffer);

  const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
  if (/facet\s+normal/i.test(text)) return parseASCII(text);

  // Ambiguous payload: fall back to binary parsing.
  return parseBinary(arrayBuffer);
}

/**
 * Read a File/Blob and analyse it. Returns geometry metrics or throws.
 */
export async function analyzeSTLFile(file) {
  const buffer = await file.arrayBuffer();
  const result = parseSTL(buffer);
  if (!result.triangles || result.volumeMm3 <= 0) {
    throw new Error('Tidak ada volume padat yang terbaca (mesh mungkin tidak watertight).');
  }
  return result;
}
