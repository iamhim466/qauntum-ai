// Shared Three.js utility functions

/**
 * Create a radial glow canvas texture for sprites.
 * @param color - hex color (e.g. 0xec4899)
 */
export function createGlowCanvas(color: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
  gradient.addColorStop(0.4, `rgba(${r},${g},${b},0.2)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}
