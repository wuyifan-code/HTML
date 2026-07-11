/**
 * scripts/png-diff.cjs
 *
 * Pixel-level PNG comparison utility using pngjs.
 *
 * Algorithm:
 *   - Decode both PNGs to RGBA.
 *   - Both images must have identical dimensions.
 *   - For each pixel, compute the per-channel absolute difference.
 *   - If all four channels differ by <= ANTIALIAS_TOLERANCE (8), the pixel is
 *     considered anti-aliasing and NOT counted as a mismatch.
 *   - Masked regions (provided as {x,y,width,height} rectangles) are skipped.
 *   - Outputs: { width, height, comparedPixels, mismatchedPixels, mismatchRatio }
 *   - Generates a diff PNG where matching pixels are 20% gray and mismatching
 *     pixels are opaque red (#ff0000).
 *
 * Usage (programmatic):
 *   const { comparePngs } = require("./png-diff.cjs");
 *   const result = comparePngs(refPath, actualPath, masks, diffPath);
 *
 * Usage (CLI):
 *   node scripts/png-diff.cjs <reference.png> <actual.png> [diff.png]
 */

const fs = require("fs");
const { PNG } = require("pngjs");

const ANTIALIAS_TOLERANCE = 8;

/**
 * @typedef {{ x: number, y: number, width: number, height: number }} Rect
 */

/**
 * Check whether a pixel coordinate falls inside any mask rectangle.
 * @param {number} x
 * @param {number} y
 * @param {Rect[]} masks
 * @returns {boolean}
 */
function isMasked(x, y, masks) {
  for (const m of masks) {
    if (x >= m.x && x < m.x + m.width && y >= m.y && y < m.y + m.height) {
      return true;
    }
  }
  return false;
}

/**
 * Compare two PNG files pixel by pixel.
 *
 * @param {string} referencePath — path to the reference PNG
 * @param {string} actualPath — path to the actual PNG
 * @param {Rect[]} masks — array of mask rectangles to exclude
 * @param {string} [diffPath] — optional output path for the diff PNG
 * @returns {{ width: number, height: number, comparedPixels: number, mismatchedPixels: number, mismatchRatio: number }}
 */
function comparePngs(referencePath, actualPath, masks = [], diffPath) {
  const refBuf = fs.readFileSync(referencePath);
  const actBuf = fs.readFileSync(actualPath);

  const ref = PNG.sync.read(refBuf);
  const act = PNG.sync.read(actBuf);

  if (ref.width !== act.width || ref.height !== act.height) {
    throw new Error(
      `Dimension mismatch: reference ${ref.width}x${ref.height} vs actual ${act.width}x${act.height}`,
    );
  }

  const width = ref.width;
  const height = ref.height;
  let comparedPixels = 0;
  let mismatchedPixels = 0;

  // Diff PNG: matching = 20% gray (51), mismatching = red (255,0,0)
  const diff = diffPath ? new PNG({ width, height }) : null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isMasked(x, y, masks)) {
        continue;
      }

      const idx = (width * y + x) << 2;
      const dr = Math.abs(ref.data[idx] - act.data[idx]);
      const dg = Math.abs(ref.data[idx + 1] - act.data[idx + 1]);
      const db = Math.abs(ref.data[idx + 2] - act.data[idx + 2]);
      const da = Math.abs(ref.data[idx + 3] - act.data[idx + 3]);

      comparedPixels++;

      const isMismatch = dr > ANTIALIAS_TOLERANCE || dg > ANTIALIAS_TOLERANCE || db > ANTIALIAS_TOLERANCE || da > ANTIALIAS_TOLERANCE;

      if (isMismatch) {
        mismatchedPixels++;
      }

      if (diff) {
        const diffIdx = (width * y + x) << 2;
        if (isMismatch) {
          diff.data[diffIdx] = 255;     // R
          diff.data[diffIdx + 1] = 0;   // G
          diff.data[diffIdx + 2] = 0;   // B
          diff.data[diffIdx + 3] = 255; // A
        } else {
          const gray = 51; // 20% of 255
          diff.data[diffIdx] = gray;
          diff.data[diffIdx + 1] = gray;
          diff.data[diffIdx + 2] = gray;
          diff.data[diffIdx + 3] = 255;
        }
      }
    }
  }

  if (diff && diffPath) {
    fs.mkdirSync(require("path").dirname(diffPath), { recursive: true });
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  const mismatchRatio = comparedPixels > 0 ? mismatchedPixels / comparedPixels : 0;

  return {
    width,
    height,
    comparedPixels,
    mismatchedPixels,
    mismatchRatio,
  };
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node scripts/png-diff.cjs <reference.png> <actual.png> [diff.png]");
    process.exit(1);
  }
  const [refPath, actPath, diffPath] = args;
  try {
    const result = comparePngs(refPath, actPath, [], diffPath);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.mismatchRatio <= 0.015 ? 0 : 1);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { comparePngs, ANTIALIAS_TOLERANCE };
