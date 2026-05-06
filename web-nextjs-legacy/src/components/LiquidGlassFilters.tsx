'use client';

import { useEffect } from 'react';

// 채팅 말풍선용 둥근 사각형 displacement map (kube.io 기법)
function generateRoundedRectMap(width: number, height: number, cornerRadius: number, curvePower: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  const cx = width / 2;
  const cy = height / 2;
  const innerHalfW = width / 2 - cornerRadius;
  const innerHalfH = height / 2 - cornerRadius;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const hx = Math.abs(x - cx);
      const hy = Math.abs(y - cy);
      const dx = Math.max(0, hx - innerHalfW);
      const dy = Math.max(0, hy - innerHalfH);

      let nx = 0, ny = 0, magnitude = 0;
      let inside = true;

      if (dx === 0 && dy === 0) {
        const distToVerticalEdge = innerHalfW + cornerRadius - hx;
        const distToHorizontalEdge = innerHalfH + cornerRadius - hy;

        let edgeDist: number;
        if (distToVerticalEdge < distToHorizontalEdge) {
          edgeDist = distToVerticalEdge;
          nx = x > cx ? 1 : -1;
          ny = 0;
        } else {
          edgeDist = distToHorizontalEdge;
          nx = 0;
          ny = y > cy ? 1 : -1;
        }
        const nd = Math.max(0, (cornerRadius - edgeDist) / cornerRadius);
        magnitude = Math.pow(nd, curvePower);
      } else {
        const cornerDist = Math.sqrt(dx * dx + dy * dy);
        if (cornerDist <= cornerRadius) {
          nx = (x > cx ? 1 : -1) * (dx / cornerDist || 0);
          ny = (y > cy ? 1 : -1) * (dy / cornerDist || 0);
          const nd = cornerDist / cornerRadius;
          magnitude = Math.pow(nd, curvePower);
        } else {
          inside = false;
        }
      }

      const i = (y * width + x) * 4;
      if (inside) {
        imgData.data[i] = 128 + nx * magnitude * 127;
        imgData.data[i + 1] = 128 + ny * magnitude * 127;
        imgData.data[i + 2] = 128;
        imgData.data[i + 3] = 255;
      } else {
        imgData.data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function LiquidGlassFilters() {
  useEffect(() => {
    const rect = generateRoundedRectMap(360, 240, 24, 1.6);
    document.getElementById('lg-rect-map')?.setAttribute('href', rect);
  }, []);

  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
    >
      {/* 채팅 말풍선 전용 굴절 필터 */}
      <filter
        id="lg-rect"
        x="0"
        y="0"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
        colorInterpolationFilters="sRGB"
      >
        <feImage id="lg-rect-map" href="" result="map" preserveAspectRatio="none" x="0" y="0" width="1" height="1" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="55" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
