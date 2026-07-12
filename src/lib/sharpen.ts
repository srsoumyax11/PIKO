export function applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount === 0) return;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const mix = amount; // 0 to 1
  
  // A simple 3x3 unsharp mask kernel
  const weights = [
     0,    -1,     0,
    -1,     5,    -1,
     0,    -1,     0
  ];
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);

  const src = new Uint8ClampedArray(data);
  const sw = width;
  const sh = height;
  const w = sw;
  const h = sh;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * w + x) * 4;
      
      let r = 0, g = 0, b = 0;
      
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = Math.min(Math.max(sy + cy - halfSide, 0), sh - 1);
          const scx = Math.min(Math.max(sx + cx - halfSide, 0), sw - 1);
          const srcOff = (scy * sw + scx) * 4;
          const wt = weights[cy * side + cx];
          
          r += src[srcOff] * wt;
          g += src[srcOff + 1] * wt;
          b += src[srcOff + 2] * wt;
        }
      }

      // Mix original with sharpened
      const origR = src[dstOff];
      const origG = src[dstOff + 1];
      const origB = src[dstOff + 2];

      data[dstOff]     = origR + (r - origR) * mix;
      data[dstOff + 1] = origG + (g - origG) * mix;
      data[dstOff + 2] = origB + (b - origB) * mix;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
