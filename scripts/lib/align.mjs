/**
 * Stabilises a walk-cycle frame sequence.
 *
 * Frames arrive with the subject drifting: the generator re-frames slightly
 * between poses, a video model lets the model creep across the shot, and
 * background removal trims each silhouette a little differently. Played back,
 * that drift reads as jitter and swamps the actual gait — the figure appears to
 * twitch rather than walk.
 *
 * The fix is to re-register every frame against two landmarks that a walking
 * body genuinely holds still:
 *
 *   • the ground line — the lowest opaque pixel. In a walk at least one foot is
 *     always planted, so the bottom of the silhouette *is* the floor.
 *   • the torso axis — the horizontal centre of mass of the upper body. Hips
 *     and shoulders track forward smoothly while the limbs swing, so this is
 *     far steadier than the centre of the bounding box, which lurches outward
 *     every time the legs scissor.
 *
 * Scale is the one judgement call. Silhouette height varies for two unrelated
 * reasons: the generator rendering the figure at a slightly different size
 * (drift, unwanted) and the body genuinely rising at mid-stride and dropping at
 * contact (bob, wanted). They are indistinguishable from a silhouette, so the
 * `stabilise` strength picks a point between them:
 *
 *   0   every frame shares one scale — drift survives, and so does the bob.
 *       Right for frames pulled from a video, which have no drift.
 *   1   every frame is scaled to the same silhouette height — drift is gone,
 *       and so is the bob. Right for independently generated frames, where
 *       drift dominates and a size pulse is far uglier than a missing bob.
 *
 * The hero timeline applies its own vertical bob on top, so losing the source
 * bob costs less than it sounds.
 */

/** Alpha below this is treated as empty. Feathered cutout edges sit under it. */
const ALPHA_FLOOR = 26;

/** Measurement runs on a downscale; full-resolution scanning buys no accuracy. */
const MEASURE_WIDTH = 360;

/**
 * Locates the silhouette in one frame: its bounding box and torso axis,
 * reported in fractions of the source image so the caller can apply them at
 * any resolution.
 */
export async function measureFrame(buffer, sharp) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .resize({ width: MEASURE_WIDTH, fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] <= ALPHA_FLOOR) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  if (x1 < 0) return null; // fully transparent frame

  // Torso axis: alpha-weighted mean x over the upper 45% of the figure. Taking
  // the head and chest only keeps swinging arms and scissoring legs out of it.
  const torsoBottom = Math.round(y0 + (y1 - y0) * 0.45);
  let sum = 0;
  let weight = 0;
  for (let y = y0; y <= torsoBottom; y++) {
    for (let x = x0; x <= x1; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha <= ALPHA_FLOOR) continue;
      sum += x * alpha;
      weight += alpha;
    }
  }
  const axis = weight > 0 ? sum / weight : (x0 + x1) / 2;

  return {
    // Fractions of the source, so they survive any later resize.
    left: x0 / width,
    right: (x1 + 1) / width,
    top: y0 / height,
    bottom: (y1 + 1) / height,
    axis: axis / width,
    heightFraction: (y1 + 1 - y0) / height,
  };
}

/**
 * Works out the shared canvas and the per-frame placement for a sequence.
 *
 * `targetHeight` is the height the median silhouette should occupy; the canvas
 * is then made tall enough for the tallest frame and wide enough for the widest
 * reach on either side of the torso axis, so no frame is ever clipped.
 */
export function planSequence(
  measurements,
  { targetHeight, sourceSizes, stabilise = 1 },
) {
  if (!measurements.some(Boolean)) {
    throw new Error("no measurable frames in sequence");
  }

  // Silhouette height in source pixels, per frame.
  const heights = measurements.map((m, i) =>
    m ? m.heightFraction * sourceSizes[i].height : null,
  );
  const sorted = heights.filter(Boolean).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const k = Math.min(1, Math.max(0, stabilise));

  // Each frame is measured against a blend of its own height and the
  // sequence median; k decides how far toward its own height we go.
  const scales = heights.map((h) =>
    h === null ? targetHeight / median : targetHeight / (median * (1 - k) + h * k),
  );

  let reachLeft = 0;
  let reachRight = 0;
  let tallest = 0;

  measurements.forEach((m, i) => {
    if (!m) return;
    const { width, height } = sourceSizes[i];
    const scale = scales[i];
    const axisPx = m.axis * width;
    reachLeft = Math.max(reachLeft, (axisPx - m.left * width) * scale);
    reachRight = Math.max(reachRight, (m.right * width - axisPx) * scale);
    tallest = Math.max(tallest, m.heightFraction * height * scale);
  });

  // 4% breathing room so an antialiased edge never touches the canvas border.
  const canvasWidth = Math.ceil((reachLeft + reachRight) * 1.04);
  const canvasHeight = Math.ceil(tallest * 1.04);
  const groundLine = canvasHeight - Math.round(canvasHeight * 0.015);
  const axisLine = Math.round(reachLeft * 1.02);

  return { scales, canvasWidth, canvasHeight, groundLine, axisLine };
}

/**
 * Renders one frame onto the shared canvas with its ground line and torso axis
 * registered to the plan.
 */
export async function alignFrame(buffer, measurement, plan, sourceSize, sharp, index = 0) {
  const { scales, canvasWidth, canvasHeight, groundLine, axisLine } = plan;
  const scale = scales[index];

  const resizedWidth = Math.max(1, Math.round(sourceSize.width * scale));
  const resizedHeight = Math.max(1, Math.round(sourceSize.height * scale));

  // Where the frame must sit so its landmarks land on the plan's lines.
  const dx = Math.round(axisLine - measurement.axis * resizedWidth);
  const dy = Math.round(groundLine - measurement.bottom * resizedHeight);

  // Clip to the overlap between the placed frame and the canvas: a frame that
  // would hang off an edge is cropped rather than rejected.
  const cropLeft = Math.max(0, -dx);
  const cropTop = Math.max(0, -dy);
  const cropWidth = Math.min(resizedWidth - cropLeft, canvasWidth - Math.max(0, dx));
  const cropHeight = Math.min(resizedHeight - cropTop, canvasHeight - Math.max(0, dy));

  if (cropWidth <= 0 || cropHeight <= 0) {
    throw new Error("aligned frame falls entirely outside the canvas");
  }

  const piece = await sharp(buffer)
    .resize(resizedWidth, resizedHeight, { fit: "fill" })
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .toBuffer();

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: piece, left: Math.max(0, dx), top: Math.max(0, dy) }])
    .png() // lossless handoff; the caller encodes to WebP
    .toBuffer();
}
