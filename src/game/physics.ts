/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BallState, TrajectoryPrediction, TrajectoryPoint, BallType } from './types';
import { sounds } from './audio';

// Standard 9ft Pool Table Metrics (scaled in meters)
export const TABLE_WIDTH = 1.0;  // X: -0.5 to 0.5
export const TABLE_LENGTH = 2.0; // Z: -1.0 to 1.0
export const BALL_RADIUS = 0.0285;
export const BALL_DIAMETER = BALL_RADIUS * 2;
// Authentic 8 Ball Pool wide pocket radii (widened to match reference image so balls pocket smoothly)
export const POCKET_RADIUS_CORNER = 0.065;
export const POCKET_RADIUS_SIDE = 0.062;

export const POCKETS = [
  { id: 'top-left', x: -TABLE_WIDTH / 2, z: -TABLE_LENGTH / 2, radius: POCKET_RADIUS_CORNER, isCorner: true },
  { id: 'top-right', x: TABLE_WIDTH / 2, z: -TABLE_LENGTH / 2, radius: POCKET_RADIUS_CORNER, isCorner: true },
  { id: 'mid-left', x: -TABLE_WIDTH / 2 - 0.004, z: 0, radius: POCKET_RADIUS_SIDE, isCorner: false },
  { id: 'mid-right', x: TABLE_WIDTH / 2 + 0.004, z: 0, radius: POCKET_RADIUS_SIDE, isCorner: false },
  { id: 'bot-left', x: -TABLE_WIDTH / 2, z: TABLE_LENGTH / 2, radius: POCKET_RADIUS_CORNER, isCorner: true },
  { id: 'bot-right', x: TABLE_WIDTH / 2, z: TABLE_LENGTH / 2, radius: POCKET_RADIUS_CORNER, isCorner: true },
];

// Physical constants tuned for moderate, natural movement after playing
const GRAVITY = 9.81;
const ROLLING_FRICTION = 0.038; // Moderate smooth rolling friction (reduced from 0.062 so balls roll with moderate, natural momentum)
const SLIDING_FRICTION = 0.09;
const BALL_RESTITUTION = 0.96; // Crisp, elastic collisions
const CUSHION_RESTITUTION = 0.80; // Cushions maintain moderate bounce energy
const MIN_SPEED = 0.015; // Natural resting threshold without long creeping delays


export interface StepEvents {
  ballCollisions: { ballA: number; ballB: number; speed: number }[];
  cushionHits: { ballId: number; speed: number }[];
  pocketDrops: { ballId: number; pocketId: string }[];
}

// Racks up the balls for 8-ball, 9-ball, trick shots, or practice
export function createInitialRack(mode: '8ball' | '9ball' | 'practice' | 'trick_shot' | 'time_challenge'): BallState[] {
  const balls: BallState[] = [];

  const createBall = (id: number, x: number, z: number): BallState => {
    let type: BallType = 'solid';
    if (id === 0) type = 'cue';
    else if (id === 8) type = 'eight';
    else if (id === 9 && mode === '9ball') type = 'nine';
    else if (id > 8) type = 'stripe';

    return {
      id,
      type,
      x,
      y: BALL_RADIUS,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      spinZ: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      inPocket: false,
      pocketDropProgress: 0,
    };
  };

  // Cue ball at head string
  balls.push(createBall(0, 0, 0.5));

  if (mode === '8ball' || mode === 'practice' || mode === 'time_challenge') {
    // Official 8-ball triangle rack at foot spot (Z = -0.5)
    // Row 1: 1 ball (Apex)
    // Row 2: 2 balls
    // Row 3: 3 balls (8-ball in center)
    // Row 4: 4 balls
    // Row 5: 5 balls (Solid and Stripe on bottom corners)
    const apexZ = -0.5;
    const dy = BALL_DIAMETER * Math.sin(Math.PI / 3) * 1.01; // Row spacing
    const dx = BALL_DIAMETER * 1.01;

    // Ball layout with 8 in center and corners mixed
    const rackOrder = [
      1,
      10, 2,
      3, 8, 14,
      9, 5, 12, 7,
      15, 6, 11, 4, 13
    ];

    let ballIdx = 0;
    for (let row = 0; row < 5; row++) {
      const rowZ = apexZ - row * dy;
      const startX = -(row * dx) / 2;
      for (let col = 0; col <= row; col++) {
        const id = rackOrder[ballIdx++];
        const x = startX + col * dx + (Math.random() - 0.5) * 0.0005; // tiny organic offset
        balls.push(createBall(id, x, rowZ));
      }
    }
  } else if (mode === '9ball') {
    // 9-Ball Diamond rack: 1 at apex, 9 in center, lowest row 1 ball
    const apexZ = -0.5;
    const dy = BALL_DIAMETER * Math.sin(Math.PI / 3) * 1.01;
    const dx = BALL_DIAMETER * 1.01;

    // Diamond rows: 1, 2, 3, 2, 1
    const diamondLayout = [
      { id: 1, row: 0, col: 0 },
      { id: 2, row: 1, col: 0 }, { id: 3, row: 1, col: 1 },
      { id: 4, row: 2, col: 0 }, { id: 9, row: 2, col: 1 }, { id: 5, row: 2, col: 2 },
      { id: 6, row: 3, col: 0 }, { id: 7, row: 3, col: 1 },
      { id: 8, row: 4, col: 0 },
    ];

    diamondLayout.forEach(({ id, row, col }) => {
      let rowCount = 1;
      if (row === 1 || row === 3) rowCount = 2;
      else if (row === 2) rowCount = 3;

      const rowZ = apexZ - row * dy;
      const startX = -((rowCount - 1) * dx) / 2;
      const x = startX + col * dx;
      balls.push(createBall(id, x, rowZ));
    });
  } else if (mode === 'trick_shot') {
    // Challenge 1: The Corner Carom Bank
    balls.push(createBall(8, 0.32, -0.75));
    balls.push(createBall(1, 0.32, -0.62));
    balls.push(createBall(9, -0.2, -0.3));
  }

  return balls;
}

// Check if all balls on table are at rest
export function areBallsAtRest(balls: BallState[]): boolean {
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    if (b.inPocket) {
      if (b.pocketDropProgress < 1) return false;
      continue;
    }
    const speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
    if (speed > MIN_SPEED || Math.abs(b.vy) > 0.001) {
      return false;
    }
  }
  return true;
}

// Stop all balls completely
export function stopAllBalls(balls: BallState[]) {
  balls.forEach(b => {
    b.vx = 0;
    b.vy = 0;
    b.vz = 0;
    b.spinX = 0;
    b.spinY = 0;
    b.spinZ = 0;
  });
}

// Apply strike impulse to cue ball from cue stick
export function strikeCueBall(
  cueBall: BallState,
  angle: number, // Aim angle in radians
  power: number, // 0 to 1
  spinOffset: { x: number; y: number } = { x: 0, y: 0 } // -1 to 1
) {
  // Balanced speed scaling calibrated for moderate, lively mobile pool feel:
  // Min ~0.75 m/s, Medium ~2.7 m/s, Break ~4.6 m/s
  const baseSpeed = 0.75 + power * 3.85;

  // Cue direction unit vector
  const dirX = Math.sin(angle);
  const dirZ = -Math.cos(angle);

  cueBall.vx = dirX * baseSpeed;
  cueBall.vz = dirZ * baseSpeed;

  // Spin impartation:
  // spinOffset.y > 0 = Topspin / Follow (forward rotation)
  // spinOffset.y < 0 = Backspin / Draw (reverse rotation)
  // spinOffset.x = English / Side spin (spin around Y)
  const spinFactor = 40 * power;
  cueBall.spinY = -spinOffset.x * spinFactor * 0.8;
  cueBall.spinX = dirZ * (spinOffset.y * spinFactor);
  cueBall.spinZ = -dirX * (spinOffset.y * spinFactor);

  sounds.playCueStrike(power);
}

// Advance physics by dt with multiple sub-steps for precision
export function stepPhysics(balls: BallState[], dt: number): StepEvents {
  const events: StepEvents = {
    ballCollisions: [],
    cushionHits: [],
    pocketDrops: [],
  };

  const clampedDt = Math.min(dt, 0.05);
  const SUB_STEPS = 8;
  const subDt = clampedDt / SUB_STEPS;

  for (let step = 0; step < SUB_STEPS; step++) {
    // 1. Move balls and apply friction
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      if (b.inPocket) {
        // Realistic 3D pocket entry and gravity drop into the pocket cup
        if (b.pocketDropProgress < 1) {
          // Downward gravity acceleration
          b.vy -= 14.0 * subDt;
          b.y += b.vy * subDt;

          // Inward travel toward pocket center
          b.x += b.vx * subDt;
          b.z += b.vz * subDt;
          b.vx *= 0.92;
          b.vz *= 0.92;

          // Rolling spin continues during pocket entry
          const dropSpeed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
          if (dropSpeed > 0.001) {
            const rollAngle = (dropSpeed * subDt) / BALL_RADIUS;
            b.rotX += (b.vz / dropSpeed) * rollAngle;
            b.rotZ += (-b.vx / dropSpeed) * rollAngle;
          }

          // Progress calculated from depth below slate
          const depth = BALL_RADIUS - b.y;
          b.pocketDropProgress = Math.min(1, Math.max(0.01, depth / 0.07));

          if (b.pocketDropProgress >= 1 || b.y <= -0.065) {
            b.pocketDropProgress = 1;
            b.y = -0.065;
            b.vx = 0;
            b.vy = 0;
            b.vz = 0;
          }
        }
        continue;
      }

      // Check pocket entry
      for (const p of POCKETS) {
        const dx = b.x - p.x;
        const dz = b.z - p.z;
        const distSq = dx * dx + dz * dz;
        const catchRadius = p.radius * 0.98;

        if (distSq < catchRadius * catchRadius) {
          b.inPocket = true;
          b.pocketDropProgress = 0.01;
          const dist = Math.max(0.001, Math.sqrt(distSq));
          const toX = p.x - b.x;
          const toZ = p.z - b.z;
          // Guide velocity smoothly toward the pocket center with natural lip roll
          const currentSpeed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
          const pullSpeed = Math.max(0.35, currentSpeed * 0.75);
          b.vx = b.vx * 0.3 + (toX / dist) * pullSpeed;
          b.vz = b.vz * 0.3 + (toZ / dist) * pullSpeed;
          b.vy = -0.22; // Initial downward tip as ball crosses the pocket rim
          events.pocketDrops.push({ ballId: b.id, pocketId: p.id });
          sounds.playPocketDrop();
          break;
        }
      }

      if (b.inPocket) continue;

      // Update position
      b.x += b.vx * subDt;
      b.z += b.vz * subDt;

      // True 3D rolling rotation
      const speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
      if (speed > 0.0001) {
        // Angular rotation distance
        const rollAngle = (speed * subDt) / BALL_RADIUS;
        const rotAxisX = b.vz / speed;
        const rotAxisZ = -b.vx / speed;

        b.rotX += rotAxisX * rollAngle;
        b.rotZ += rotAxisZ * rollAngle;

        // Friction slowing down
        const frictionAccel = ROLLING_FRICTION * GRAVITY;
        const speedReduction = frictionAccel * subDt;
        const newSpeed = Math.max(0, speed - speedReduction);
        const ratio = newSpeed / speed;
        b.vx *= ratio;
        b.vz *= ratio;

        // Spin decay
        b.spinX *= 0.985;
        b.spinY *= 0.985;
        b.spinZ *= 0.985;
      } else {
        b.vx = 0;
        b.vz = 0;
        b.spinX = 0;
        b.spinY = 0;
        b.spinZ = 0;
      }
    }

    // 2. Cushion Rail Collisions
    const minX = -TABLE_WIDTH / 2 + BALL_RADIUS;
    const maxX = TABLE_WIDTH / 2 - BALL_RADIUS;
    const minZ = -TABLE_LENGTH / 2 + BALL_RADIUS;
    const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS;

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      if (b.inPocket) continue;

      // Near corner/side pocket cutouts, cushions don't extend into wider pocket mouths
      const isNearSidePocket = Math.abs(b.z) < 0.078;
      const isNearCornerPocket = (Math.abs(b.z) > (TABLE_LENGTH / 2 - 0.080)) && (Math.abs(b.x) > (TABLE_WIDTH / 2 - 0.080));

      // Left cushion
      if (b.x < minX && !isNearSidePocket && !isNearCornerPocket) {
        b.x = minX;
        b.vx = -b.vx * CUSHION_RESTITUTION;
        // Side spin angle throw
        b.vz += b.spinY * 0.015;
        const speed = Math.abs(b.vx);
        events.cushionHits.push({ ballId: b.id, speed });
        sounds.playCushionHit(speed);
      }
      // Right cushion
      else if (b.x > maxX && !isNearSidePocket && !isNearCornerPocket) {
        b.x = maxX;
        b.vx = -b.vx * CUSHION_RESTITUTION;
        b.vz -= b.spinY * 0.015;
        const speed = Math.abs(b.vx);
        events.cushionHits.push({ ballId: b.id, speed });
        sounds.playCushionHit(speed);
      }

      // Top cushion
      if (b.z < minZ && !isNearCornerPocket) {
        b.z = minZ;
        b.vz = -b.vz * CUSHION_RESTITUTION;
        b.vx += b.spinY * 0.015;
        const speed = Math.abs(b.vz);
        events.cushionHits.push({ ballId: b.id, speed });
        sounds.playCushionHit(speed);
      }
      // Bottom cushion
      else if (b.z > maxZ && !isNearCornerPocket) {
        b.z = maxZ;
        b.vz = -b.vz * CUSHION_RESTITUTION;
        b.vx -= b.spinY * 0.015;
        const speed = Math.abs(b.vz);
        events.cushionHits.push({ ballId: b.id, speed });
        sounds.playCushionHit(speed);
      }

      // Hard table boundary safety limit (prevents any tunnelling outside cushion frame)
      const hardMaxX = TABLE_WIDTH / 2;
      const hardMaxZ = TABLE_LENGTH / 2;
      if (!b.inPocket) {
        if (b.x < -hardMaxX) { b.x = -hardMaxX + BALL_RADIUS; b.vx = Math.abs(b.vx) * 0.5; }
        if (b.x > hardMaxX) { b.x = hardMaxX - BALL_RADIUS; b.vx = -Math.abs(b.vx) * 0.5; }
        if (b.z < -hardMaxZ) { b.z = -hardMaxZ + BALL_RADIUS; b.vz = Math.abs(b.vz) * 0.5; }
        if (b.z > hardMaxZ) { b.z = hardMaxZ - BALL_RADIUS; b.vz = -Math.abs(b.vz) * 0.5; }
      }
    }

    // 3. Ball-to-Ball Elastic Collisions
    for (let i = 0; i < balls.length; i++) {
      const b1 = balls[i];
      if (b1.inPocket) continue;

      for (let j = i + 1; j < balls.length; j++) {
        const b2 = balls[j];
        if (b2.inPocket) continue;

        const dx = b2.x - b1.x;
        const dz = b2.z - b1.z;
        const distSq = dx * dx + dz * dz;
        const minDist = BALL_DIAMETER;

        if (distSq < minDist * minDist && distSq > 0.000001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;

          // Separate balls to prevent sticking / overlap
          const overlap = minDist - dist;
          b1.x -= nx * overlap * 0.5;
          b1.z -= nz * overlap * 0.5;
          b2.x += nx * overlap * 0.5;
          b2.z += nz * overlap * 0.5;

          // Relative velocity along collision normal
          const kx = b1.vx - b2.vx;
          const kz = b1.vz - b2.vz;
          const approachSpeed = nx * kx + nz * kz; // Approach speed along normal

          if (approachSpeed > 0) {
            // Full elastic momentum transfer: delta_v = ((1 + e) / 2) * approach_speed
            const impulse = approachSpeed * ((1 + BALL_RESTITUTION) / 2);
            b1.vx -= impulse * nx;
            b1.vz -= impulse * nz;
            b2.vx += impulse * nx;
            b2.vz += impulse * nz;

            // Apply spin transfer (follow / draw / english effects)
            if (b1.id === 0) {
              b1.vx += b1.spinX * 0.012;
              b1.vz += b1.spinZ * 0.012;
            } else if (b2.id === 0) {
              b2.vx += b2.spinX * 0.012;
              b2.vz += b2.spinZ * 0.012;
            }

            const impactSpeed = Math.sqrt(kx * kx + kz * kz);
            events.ballCollisions.push({ ballA: b1.id, ballB: b2.id, speed: impactSpeed });
            sounds.playBallHit(impactSpeed);
          }
        }
      }
    }
  }

  return events;
}

// Precise Trajectory Raycasting Prediction for Aiming Line & Ghost Ball
export function calculateTrajectory(
  balls: BallState[],
  aimAngle: number,
  aimLineLengthMultiplier = 1.0
): TrajectoryPrediction {
  const cue = balls.find(b => b.id === 0);
  if (!cue || cue.inPocket) {
    return {
      cueLine: [],
      ghostCuePos: null,
      targetBallId: null,
      targetBallLine: [],
      deflectionCueLine: [],
      targetPocket: null,
      scratchRisk: false,
    };
  }

  const dirX = Math.sin(aimAngle);
  const dirZ = -Math.cos(aimAngle);

  // Maximum aiming ray distance
  const maxDist = 2.4 * aimLineLengthMultiplier;
  const step = 0.008;
  let curX = cue.x;
  let curZ = cue.z;
  let traveled = 0;

  const cueLine: TrajectoryPoint[] = [{ x: curX, z: curZ }];
  let hitBall: BallState | null = null;
  let ghostX = curX;
  let ghostZ = curZ;

  // Raycast forward from cue ball
  while (traveled < maxDist) {
    curX += dirX * step;
    curZ += dirZ * step;
    traveled += step;

    // Check hit against active balls
    for (const b of balls) {
      if (b.id === 0 || b.inPocket) continue;
      const dx = curX - b.x;
      const dz = curZ - b.z;
      if (dx * dx + dz * dz <= BALL_DIAMETER * BALL_DIAMETER) {
        hitBall = b;
        ghostX = curX;
        ghostZ = curZ;
        break;
      }
    }

    if (hitBall) break;

    // Check hit against cushions
    const minX = -TABLE_WIDTH / 2 + BALL_RADIUS;
    const maxX = TABLE_WIDTH / 2 - BALL_RADIUS;
    const minZ = -TABLE_LENGTH / 2 + BALL_RADIUS;
    const maxZ = TABLE_LENGTH / 2 - BALL_RADIUS;

    if (curX <= minX || curX >= maxX || curZ <= minZ || curZ >= maxZ) {
      break;
    }

    cueLine.push({ x: curX, z: curZ });
  }

  // If no ball hit, return cushion end
  if (!hitBall) {
    return {
      cueLine,
      ghostCuePos: null,
      targetBallId: null,
      targetBallLine: [],
      deflectionCueLine: [],
      targetPocket: null,
      scratchRisk: false,
    };
  }

  cueLine.push({ x: ghostX, z: ghostZ });

  // Calculate target ball deflection vector (along line of centers)
  const normX = hitBall.x - ghostX;
  const normZ = hitBall.z - ghostZ;
  const normLen = Math.sqrt(normX * normX + normZ * normZ) || 1;
  const targetDirX = normX / normLen;
  const targetDirZ = normZ / normLen;

  // Target ball trajectory line
  const targetBallLine: TrajectoryPoint[] = [
    { x: hitBall.x, z: hitBall.z },
    { x: hitBall.x + targetDirX * 0.45 * aimLineLengthMultiplier, z: hitBall.z + targetDirZ * 0.45 * aimLineLengthMultiplier }
  ];

  // Cue ball deflection vector (tangential to collision line)
  // v_tangent = dir - (dir . normal) * normal
  const dot = dirX * targetDirX + dirZ * targetDirZ;
  const cueDeflectX = dirX - dot * targetDirX;
  const cueDeflectZ = dirZ - dot * targetDirZ;
  const cueDeflectLen = Math.sqrt(cueDeflectX * cueDeflectX + cueDeflectZ * cueDeflectZ) || 1;

  const deflectionCueLine: TrajectoryPoint[] = [
    { x: ghostX, z: ghostZ },
    { x: ghostX + (cueDeflectX / cueDeflectLen) * 0.28, z: ghostZ + (cueDeflectZ / cueDeflectLen) * 0.28 }
  ];

  // Find nearest pocket to target ball trajectory
  let nearestPocket: { x: number; z: number } | null = null;
  let minPocketDist = Infinity;
  for (const p of POCKETS) {
    const toPocketX = p.x - hitBall.x;
    const toPocketZ = p.z - hitBall.z;
    const distToPocket = Math.sqrt(toPocketX * toPocketX + toPocketZ * toPocketZ);

    // Check angle alignment with generous pocket mouths
    const dotPocket = (targetDirX * toPocketX + targetDirZ * toPocketZ) / distToPocket;
    if (dotPocket > 0.88 && distToPocket < minPocketDist) {
      minPocketDist = distToPocket;
      nearestPocket = { x: p.x, z: p.z };
    }
  }

  // Check scratch risk (if cue ball trajectory heads straight into a pocket)
  let scratchRisk = false;
  for (const p of POCKETS) {
    const dx = ghostX - p.x;
    const dz = ghostZ - p.z;
    if (Math.sqrt(dx * dx + dz * dz) < 0.088) {
      scratchRisk = true;
      break;
    }
  }

  return {
    cueLine,
    ghostCuePos: { x: ghostX, z: ghostZ },
    targetBallId: hitBall.id,
    targetBallLine,
    deflectionCueLine,
    targetPocket: nearestPocket,
    scratchRisk,
  };
}
