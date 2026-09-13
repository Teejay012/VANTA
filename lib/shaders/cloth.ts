/**
 * Cloth shader for Section 3.
 *
 * The plane is a hanging textile. Scroll progress (`uProgress`) drives an
 * "unroll frontier" that travels from the top edge downwards: above it the
 * cloth has already dropped and lies comparatively flat, below it the fabric is
 * still bunched, with the folds concentrated in a band right at the frontier.
 *
 * Normals are derived analytically by re-evaluating the displacement field at
 * two small offsets, which is far cheaper than a normal map and stays correct
 * as the surface animates.
 */

export const clothVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uAmplitude;

  varying vec2 vUv;
  varying vec3 vNormalV;
  varying float vFold;
  varying float vRolled;

  // Ambient drift present across the whole textile — three detuned sines so
  // the pattern never visibly repeats.
  float ripple(vec2 p, float t) {
    return sin(p.x * 3.2 + t * 0.55) * 0.50
         + sin(p.y * 4.7 - t * 0.42 + p.x * 2.1) * 0.32
         + sin((p.x + p.y) * 6.4 + t * 0.85) * 0.18;
  }

  // Total out-of-plane displacement at a point in UV space.
  float displace(vec2 uv, float t, float progress) {
    // The frontier walks from the top edge (uv.y = 1) to the bottom.
    float front = 1.0 - progress;

    // 1 below the frontier (still rolled), 0 above it (already draped).
    float rolled = 1.0 - smoothstep(front - 0.02, front + 0.24, uv.y);

    // Tight concentric folds hugging the frontier itself.
    float foldBand = exp(-abs(uv.y - front) * 11.0);
    float curl = sin((uv.y - front) * 46.0 + uv.x * 2.0) * foldBand * 0.42;

    // The hanging weight of the cloth: bunched fabric moves more.
    float slack = mix(0.35, 1.0, rolled);

    // The top edge is pinned, so damp displacement as uv.y approaches 1.
    float pin = smoothstep(1.0, 0.72, uv.y);

    return (ripple(uv * 2.0, t) * 0.09 * slack + curl) * pin * uAmplitude;
  }

  void main() {
    vUv = uv;

    float front = 1.0 - uProgress;
    vFold = exp(-abs(uv.y - front) * 9.0);
    vRolled = 1.0 - smoothstep(front - 0.02, front + 0.24, uv.y);

    float z = displace(uv, uTime, uProgress);

    // Analytic normal: sample the field along both UV axes.
    float e = 0.004;
    float dx = displace(uv + vec2(e, 0.0), uTime, uProgress) - z;
    float dy = displace(uv + vec2(0.0, e), uTime, uProgress) - z;
    vec3 n = normalize(vec3(-dx / e, -dy / e, 1.0));
    vNormalV = normalize(normalMatrix * n);

    vec3 displaced = position + vec3(0.0, 0.0, z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const clothFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasMap;     // 1.0 once the photographic weave has loaded
  uniform float uTime;
  uniform vec3 uLight;       // light direction in view space
  uniform vec3 uBase;
  uniform vec3 uShadow;

  varying vec2 vUv;
  varying vec3 vNormalV;
  varying float vFold;
  varying float vRolled;

  // Procedural warp/weft weave. This is what renders when the photographic
  // texture is unavailable (offline, or a CDN without permissive CORS), so the
  // section never falls back to a flat colour.
  float weave(vec2 uv) {
    vec2 g = uv * 360.0;
    vec2 f = fract(g) - 0.5;
    float warp = 1.0 - smoothstep(0.16, 0.48, abs(f.x));
    float weft = 1.0 - smoothstep(0.16, 0.48, abs(f.y));
    // Alternating over/under gives the threads their interlaced look.
    float over = mod(floor(g.x) + floor(g.y), 2.0);
    return mix(warp, weft, over);
  }

  // Cheap film grain, keyed off screen position so it does not swim with the
  // cloth as it moves.
  float grain(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec3 albedo;

    if (uHasMap > 0.5) {
      // Tile the photograph a couple of times so the weave stays crisp when
      // the plane is stretched across a wide viewport.
      albedo = texture2D(uMap, vUv * vec2(1.6, 1.2)).rgb;
      // Force it to true monochrome — the palette allows nothing else.
      float l = dot(albedo, vec3(0.299, 0.587, 0.114));
      albedo = mix(uShadow, uBase, l);
    } else {
      albedo = mix(uShadow, uBase, 0.55 + weave(vUv) * 0.45);
    }

    // Lambert term plus a wide, low-intensity specular for the nylon sheen.
    vec3 n = normalize(vNormalV);
    float diffuse = clamp(dot(n, normalize(uLight)), 0.0, 1.0);
    vec3 halfway = normalize(normalize(uLight) + vec3(0.0, 0.0, 1.0));
    float spec = pow(clamp(dot(n, halfway), 0.0, 1.0), 22.0) * 0.22;

    vec3 color = albedo * (0.62 + diffuse * 0.52) + spec;

    // Bunched fabric sits in its own shadow; the frontier catches the light.
    color *= mix(1.0, 0.80, vRolled);
    color += vFold * 0.10;

    // Vignette so the panel reads as a lit object rather than a flat fill.
    vec2 c = vUv - 0.5;
    color *= 1.0 - dot(c, c) * 0.45;

    color += (grain(gl_FragCoord.xy + uTime) - 0.5) * 0.030;

    gl_FragColor = vec4(color, 1.0);
  }
`;
