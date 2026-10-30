// A still frame of the particle orb as an SVG data URI, for the favicon, app icon and link preview.
export function orbSvg(dots: number, dotSize: number) {
  const circles: string[] = [];
  const ct = Math.cos(0.4), st = Math.sin(0.4);
  for (let i = 0; i < dots; i++) {
    const y = 1 - (i / (dots - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const x = Math.cos(i * 2.39996) * r;
    const z = Math.sin(i * 2.39996) * r;
    const y1 = y * ct - z * st;
    const z1 = y * st + z * ct;
    const depth = (z1 + 1) / 2;
    const persp = 1.6 / (2.6 - z1);
    const cx = (50 + x * 40 * persp).toFixed(2);
    const cy = (50 + y1 * 40 * persp).toFixed(2);
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${(dotSize * (0.5 + depth)).toFixed(2)}" fill="#fff" fill-opacity="${(0.15 + depth * 0.85).toFixed(2)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${circles.join("")}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
