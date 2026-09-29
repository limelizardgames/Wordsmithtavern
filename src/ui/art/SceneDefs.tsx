/** Gradients shared by every scene SVG. Rendered once (App) so ids are unique. */
export function SceneDefs() {
  return (
    <defs>
      <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.62" stop-color="#000" stop-opacity="0" />
        <stop offset="1" stop-color="#000" stop-opacity="0.42" />
      </radialGradient>
      <radialGradient id="fire-light">
        <stop offset="0" stop-color="#ffb24a" stop-opacity="0.55" />
        <stop offset="0.35" stop-color="#ff8a2a" stop-opacity="0.22" />
        <stop offset="1" stop-color="#ff6a10" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="lamp-light">
        <stop offset="0" stop-color="#ffd08a" stop-opacity="0.45" />
        <stop offset="0.3" stop-color="#ffb060" stop-opacity="0.14" />
        <stop offset="1" stop-color="#ff9a40" stop-opacity="0" />
      </radialGradient>
    </defs>
  );
}
