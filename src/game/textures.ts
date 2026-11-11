/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

const BALL_COLORS: Record<number, string> = {
  1: '#facc15', // Yellow
  2: '#2563eb', // Blue
  3: '#dc2626', // Red
  4: '#7c3aed', // Purple
  5: '#ea580c', // Orange
  6: '#16a34a', // Green
  7: '#881337', // Maroon
  8: '#111827', // Black
  9: '#facc15', // Stripe Yellow
  10: '#2563eb', // Stripe Blue
  11: '#dc2626', // Stripe Red
  12: '#7c3aed', // Stripe Purple
  13: '#ea580c', // Stripe Orange
  14: '#16a34a', // Stripe Green
  15: '#881337', // Stripe Maroon
};

// Texture cache to prevent memory leaks and repeated canvas draws
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getBallTexture(ballId: number, style: string = 'classic', maxAnisotropy = 4): THREE.CanvasTexture {
  const cacheKey = `ball_${ballId}_${style}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const isCue = ballId === 0;
  const isStripe = ballId >= 9 && ballId <= 15;
  const isEight = ballId === 8;
  const color = BALL_COLORS[ballId] || '#ffffff';

  if (isCue) {
    // Cue Ball: Clean off-white polished ivory with red spin indicator dots
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle ivory gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.5, 'rgba(240,243,246,0.3)');
    grad.addColorStop(1, 'rgba(225,230,235,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 6 red dots to clearly see ball spin and roll dynamics
    const dotPositions = [
      { x: 128, y: 128 },
      { x: 384, y: 128 },
      { x: 256, y: 64 },
      { x: 256, y: 192 },
      { x: 64, y: 128 },
      { x: 448, y: 128 },
    ];
    ctx.fillStyle = '#ef4444';
    dotPositions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (isStripe) {
    // Stripe Ball: White background with wide colored band across middle
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Colored Stripe in middle
    const bandTop = canvas.height * 0.22;
    const bandHeight = canvas.height * 0.56;
    ctx.fillStyle = color;
    ctx.fillRect(0, bandTop, canvas.width, bandHeight);

    // Dark edge accents on stripe band
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, bandTop, canvas.width, 3);
    ctx.fillRect(0, bandTop + bandHeight - 3, canvas.width, 3);

    // Number circle (white badge) on front and back
    [128, 384].forEach((centerX) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, canvas.height / 2, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.stroke();

      // Number text
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 38px "Outfit", "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ballId.toString(), centerX, canvas.height / 2);

      // Underline for 6 and 9
      if (ballId === 6 || ballId === 9) {
        ctx.fillRect(centerX - 16, canvas.height / 2 + 18, 32, 4);
      }
    });
  } else {
    // Solid Ball (1-8): Full solid color with front and back white number circle
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle gloss / color depth gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, 'rgba(255,255,255,0.12)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Number circle on front and back
    [128, 384].forEach((centerX) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, canvas.height / 2, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.stroke();

      // Number text
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 40px "Outfit", "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ballId.toString(), centerX, canvas.height / 2);

      // Underline for 6 and 9
      if (ballId === 6 || ballId === 9) {
        ctx.fillRect(centerX - 16, canvas.height / 2 + 18, 32, 4);
      }
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Procedural & Image-Based Pool Table Felt Texture (Miniclip 8 Ball Pool style)
export function getFeltTexture(
  feltHex: string = '#026ee6', 
  maxAnisotropy = 4, 
  customImageUrl?: string,
  onLoaded?: () => void
): THREE.CanvasTexture {
  const cacheKey = customImageUrl ? `felt_img_${customImageUrl}` : `felt_${feltHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024; // 1:2 aspect ratio matching the 1.0m x 2.0m table
  const ctx = canvas.getContext('2d')!;

  const renderProceduralFelt = () => {
    // 1. Base vibrant royal cloth
    ctx.fillStyle = feltHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Overhead Table Light Glow (Luminous center fading to rich deep velvet at edges)
    const radGlow = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 60,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.58
    );
    radGlow.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    radGlow.addColorStop(0.45, 'rgba(255, 255, 255, 0.08)');
    radGlow.addColorStop(0.85, 'rgba(0, 0, 0, 0.18)');
    radGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Inner Cushion Overhang Drop Shadows (cushion bevel depth)
    // Top edge
    const topShadow = ctx.createLinearGradient(0, 0, 0, 36);
    topShadow.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    topShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = topShadow;
    ctx.fillRect(0, 0, canvas.width, 36);

    // Bottom edge
    const botShadow = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - 36);
    botShadow.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    botShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = botShadow;
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36);

    // Left edge
    const leftShadow = ctx.createLinearGradient(0, 0, 36, 0);
    leftShadow.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = leftShadow;
    ctx.fillRect(0, 0, 36, canvas.height);

    // Right edge
    const rightShadow = ctx.createLinearGradient(canvas.width, 0, canvas.width - 36, 0);
    rightShadow.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    rightShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = rightShadow;
    ctx.fillRect(canvas.width - 36, 0, 36, canvas.height);

    // 4. Worsted Wool Micro-weave (fine cloth crosshatch)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let x = 0; x < canvas.width; x += 4) {
      ctx.fillRect(x, 0, 1.5, canvas.height);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1.5);
    }

    // 5. Break Line (Head String) & Table Spots (Exact 8 Ball Pool table styling)
    const headStringY = canvas.height * 0.25;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(38, headStringY);
    ctx.lineTo(canvas.width - 38, headStringY);
    ctx.stroke();

    // Head Spot Dot (center of head string)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, headStringY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Foot Spot Dot (rack position at 75% length)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 0.75, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  // Render initial fallback immediately
  renderProceduralFelt();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  textureCache.set(cacheKey, texture);

  // If a custom image was requested, load it asynchronously and render it into the canvas
  if (customImageUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // In the 960x540 table image:
      // Felt bounds: X from ~66 to 894 (width: 828), Y from ~60 to 480 (height: 420)
      // We rotate 90 degrees so that the horizontal image length (828px) aligns with
      // the canvas height (1024px, table length Z), and height (420px) aligns with width (512px, table width X).
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      // Draw rotated image covering the felt surface with high visual quality
      ctx.drawImage(img, 66, 60, 828, 420, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
      ctx.restore();

      // Draw tournament lines and dots cleanly on top
      const headStringY = canvas.height * 0.25;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(32, headStringY);
      ctx.lineTo(canvas.width - 32, headStringY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, headStringY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height * 0.75, 3.5, 0, Math.PI * 2);
      ctx.fill();

      texture.needsUpdate = true;
      if (onLoaded) {
        onLoaded();
      }
    };
    img.src = customImageUrl;
  }

  return texture;
}



// Procedural Polished Table Wood Rail Texture (Warm Mahogany / Golden Walnut)
export function getWoodTexture(colorHex: string = '#854d0e', maxAnisotropy = 4): THREE.CanvasTexture {
  const cacheKey = `wood_${colorHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Flowing wood grain rings
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let y = 0; y < canvas.height; y += 4) {
    const offset = Math.sin(y * 0.08) * 12;
    ctx.fillRect(0, y + offset, canvas.width, 2);
  }

  // Soft satin highlight
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Inlaid Golden Sights / Diamond Circles (matches screenshot ornamental rails)
  [64, 192, 320, 448].forEach(x => {
    // Outer brass ring
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(x, canvas.height * 0.44, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright gold core
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x, canvas.height * 0.44, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Dark inset bevel
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, canvas.height * 0.44, 6.5, 0, Math.PI * 2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Procedural Irish Linen Cue Wrap Texture
export function getCueWrapTexture(primaryColor = '#1e293b', maxAnisotropy = 4): THREE.CanvasTexture {
  const cacheKey = `wrap_${primaryColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Crossed speckled pattern of Irish linen thread
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let x = 0; x < canvas.width; x += 4) {
    for (let y = 0; y < canvas.height; y += 4) {
      if ((x + y) % 8 === 0) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Procedural Ball Markers for distinguishing Player 1 vs Player 2 balls
export type MarkerOwnerType = 'p1' | 'p2' | 'eight_win' | 'eight_wait' | 'open' | 'nine_target' | 'none';

export function getBallMarkerTexture(ballId: number, markerType: MarkerOwnerType): THREE.CanvasTexture {
  const cacheKey = `marker_${ballId}_${markerType}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const cx = 64;
  const cy = 54;
  const r = 38;

  // Color parameters based on ball owner
  let glowColor = 'rgba(56, 189, 248, 0.45)';
  let borderColor = '#38bdf8';
  let badgeTitle = 'P1';
  let titleColor = '#38bdf8';
  let bgColor1 = '#0284c7';
  let bgColor2 = '#082f49';

  if (markerType === 'p2') {
    glowColor = 'rgba(245, 158, 11, 0.45)';
    borderColor = '#f59e0b';
    badgeTitle = 'P2';
    titleColor = '#fbbf24';
    bgColor1 = '#d97706';
    bgColor2 = '#292524';
  } else if (markerType === 'eight_win') {
    glowColor = 'rgba(234, 179, 8, 0.7)';
    borderColor = '#eab308';
    badgeTitle = 'WIN';
    titleColor = '#facc15';
    bgColor1 = '#854d0e';
    bgColor2 = '#0f172a';
  } else if (markerType === 'eight_wait') {
    glowColor = 'rgba(100, 116, 139, 0.3)';
    borderColor = '#64748b';
    badgeTitle = '8';
    titleColor = '#94a3b8';
    bgColor1 = '#334155';
    bgColor2 = '#0f172a';
  } else if (markerType === 'nine_target') {
    glowColor = 'rgba(16, 185, 129, 0.55)';
    borderColor = '#10b981';
    badgeTitle = 'TARGET';
    titleColor = '#34d399';
    bgColor1 = '#047857';
    bgColor2 = '#022c22';
  } else if (markerType === 'open') {
    glowColor = 'rgba(148, 163, 184, 0.35)';
    borderColor = '#94a3b8';
    badgeTitle = 'OPEN';
    titleColor = '#cbd5e1';
    bgColor1 = '#475569';
    bgColor2 = '#0f172a';
  }

  // Draw soft glow
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
  ctx.fillStyle = glowColor;
  ctx.fill();

  // Downward triangle pointer
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + r - 3);
  ctx.lineTo(cx, 112);
  ctx.lineTo(cx + 12, cy + r - 3);
  ctx.closePath();
  ctx.fillStyle = borderColor;
  ctx.fill();

  // Badge circular body
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx, cy - 8, 4, cx, cy, r);
  grad.addColorStop(0, bgColor1);
  grad.addColorStop(1, bgColor2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Border ring
  ctx.lineWidth = 4;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  // Badge typography
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (markerType === 'eight_win') {
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('👑', cx, cy - 9);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('WIN', cx, cy + 14);
  } else if (markerType === 'eight_wait') {
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('8', cx, cy);
  } else {
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(badgeTitle, cx, cy - 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`${ballId}`, cx, cy + 13);
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}
