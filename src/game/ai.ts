/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIPersona, AIDifficulty, BallState, PlayerGroup } from './types';
import { POCKETS, TABLE_WIDTH, TABLE_LENGTH, BALL_RADIUS, BALL_DIAMETER } from './physics';

export const AI_PERSONAS: Record<AIDifficulty, AIPersona> = {
  beginner: {
    id: 'rookie_rick',
    name: 'Rookie Rick',
    title: 'Pool Enthusiast',
    avatar: '🧢',
    difficulty: 'beginner',
    aimPrecision: 0.0025, // disciplined casual
    powerControl: 0.86,
    safetyShotProbability: 0.2,
    spinUsage: 0.3,
    quips: {
      start: ["Let's see how these balls roll!", "I'm just warming up!"],
      goodShot: ["Clean shot right into the pocket!", "Felt good off the cue!"],
      miss: ["Oof, rattled the jaw.", "Left an open angle."],
      win: ["Great game! Well played!", "Awesome match!"],
      lose: ["Good game, you're pretty skilled!", "I need more practice."],
    },
  },
  easy: {
    id: 'spike_miller',
    name: 'Spike Miller',
    title: 'Club Hustler',
    avatar: '🕶️',
    difficulty: 'easy',
    aimPrecision: 0.0015, // ~0.08 degrees variance
    powerControl: 0.90,
    safetyShotProbability: 0.3,
    spinUsage: 0.45,
    quips: {
      start: ["Get ready for some action!", "Let the balls fly!"],
      goodShot: ["Clean cut right into the pocket!", "Nothing to it."],
      miss: ["Unlucky roll on that angle.", "Almost had it!"],
      win: ["Winner takes all!", "Told you I had this."],
      lose: ["Tough break for me today.", "Rematch whenever you're ready."],
    },
  },
  normal: {
    id: 'sofia_reyes',
    name: 'Sofia Reyes',
    title: 'Sharp Shooter',
    avatar: '⚡',
    difficulty: 'normal',
    aimPrecision: 0.0006, // skilled disciplined human player (~95% open pot rate)
    powerControl: 0.95,
    safetyShotProbability: 0.45,
    spinUsage: 0.65,
    quips: {
      start: ["Focus is key in this game.", "Let's play a disciplined rack."],
      goodShot: ["Calculated and executed.", "Just like I planned."],
      miss: ["Misjudged the cloth friction.", "Left you an opening."],
      win: ["Class is in session.", "Clean finish."],
      lose: ["Impressive runout. Well played.", "You earned that win."],
    },
  },
  pro: {
    id: 'marcus_chen',
    name: 'Marcus Chen',
    title: 'Tournament Pro',
    avatar: '🎯',
    difficulty: 'pro',
    aimPrecision: 0.0002, // semi-pro precision
    powerControl: 0.98,
    safetyShotProbability: 0.65,
    spinUsage: 0.85,
    quips: {
      start: ["I don't miss many open shots.", "Prepare for high-level pool."],
      goodShot: ["Pinpoint cue ball positioning.", "In off the rail, textbook."],
      miss: ["A rare mistake.", "Don't get used to that."],
      win: ["Mastery takes discipline.", "Checkmate on the felt."],
      lose: ["Outstanding play. You're a true contender.", "Great match."],
    },
  },
  legend: {
    id: 'victoria_vance',
    name: 'Victoria "The Queen" Vance',
    title: 'World Champion',
    avatar: '👑',
    difficulty: 'legend',
    aimPrecision: 0.00005, // World champion precision
    powerControl: 0.99,
    safetyShotProbability: 0.85,
    spinUsage: 0.95,
    quips: {
      start: ["Welcome to the championship table.", "Every angle is accounted for."],
      goodShot: ["Flawless geometry.", "The cue ball obeys my command."],
      miss: ["Micro-deviation on the cushion.", "Enjoy this turn; it might be your last."],
      win: ["The crown stays where it belongs.", "Total table dominance."],
      lose: ["Remarkable. You have reached pool legend status.", "Incredible match!"],
    },
  },
};

export interface AIShotDecision {
  angle: number;
  power: number;
  spinOffset: { x: number; y: number };
  targetBallId: number;
  targetPocket: { x: number; z: number };
  isBallInHandPlacement?: { x: number; z: number };
}

// Calculate mathematically exact ghost ball position required to pot target ball into pocket
function getGhostBallPosition(
  targetBall: BallState,
  pocket: { x: number; z: number }
): { x: number; z: number; dirX: number; dirZ: number } {
  // Vector from target ball to pocket
  const toPocketX = pocket.x - targetBall.x;
  const toPocketZ = pocket.z - targetBall.z;
  const dist = Math.sqrt(toPocketX * toPocketX + toPocketZ * toPocketZ) || 1;
  const unitX = toPocketX / dist;
  const unitZ = toPocketZ / dist;

  // The ghost ball center sits exactly 1 BALL_DIAMETER directly behind the target ball along the pocket line
  return {
    x: targetBall.x - unitX * BALL_DIAMETER,
    z: targetBall.z - unitZ * BALL_DIAMETER,
    dirX: unitX,
    dirZ: unitZ,
  };
}

// Check if direct line between two points is obstructed by any other ball
function isPathClear(
  p1: { x: number; z: number },
  p2: { x: number; z: number },
  balls: BallState[],
  ignoredIds: number[]
): boolean {
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.01) return true;

  const ux = dx / len;
  const uz = dz / len;

  for (const b of balls) {
    if (b.inPocket || ignoredIds.includes(b.id)) continue;

    // Project ball center onto line segment
    const toBallX = b.x - p1.x;
    const toBallZ = b.z - p1.z;
    const proj = toBallX * ux + toBallZ * uz;

    if (proj > 0 && proj < len) {
      const perpDistSq = (toBallX * toBallX + toBallZ * toBallZ) - (proj * proj);
      if (perpDistSq < BALL_DIAMETER * BALL_DIAMETER * 0.96) {
        return false; // Obstructed
      }
    }
  }

  return true;
}

// AI decision maker: plays like an experienced human pool player
export function computeAIShot(
  balls: BallState[],
  mode: '8ball' | '9ball' | 'practice' | 'time_challenge' | 'trick_shot',
  aiGroup: PlayerGroup,
  difficulty: AIDifficulty,
  isBreakShot: boolean,
  isBallInHand: boolean
): AIShotDecision {
  const persona = AI_PERSONAS[difficulty] || AI_PERSONAS.normal;
  const cue = balls.find(b => b.id === 0);

  // If AI has ball in hand, find best strategic position lined up with an easy target ball
  let ballInHandPlacement: { x: number; z: number } | undefined;
  if (isBallInHand || !cue || cue.inPocket) {
    let bestPlacement: { x: number; z: number } | null = null;
    let bestPocketDist = Infinity;

    const activeSolids = balls.filter(b => b.id >= 1 && b.id <= 7 && !b.inPocket);
    const activeStripes = balls.filter(b => b.id >= 9 && b.id <= 15 && !b.inPocket);
    const targets = aiGroup === 'solids' 
      ? activeSolids 
      : (aiGroup === 'stripes' ? activeStripes : [...activeSolids, ...activeStripes]);

    const candidateList = targets.length > 0 ? targets : balls.filter(b => b.id !== 0 && !b.inPocket);

    for (const t of candidateList) {
      for (const p of POCKETS) {
        const pdx = p.x - t.x;
        const pdz = p.z - t.z;
        const pLen = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pLen < 0.1) continue;

        // Ideal cue placement is straight behind target ball away from pocket with slight offset
        const placeX = t.x - (pdx / pLen) * 0.28;
        const placeZ = t.z - (pdz / pLen) * 0.28;

        // Verify inside table bounds with safe margins
        if (
          placeX > -TABLE_WIDTH / 2 + BALL_RADIUS * 2.5 &&
          placeX < TABLE_WIDTH / 2 - BALL_RADIUS * 2.5 &&
          placeZ > -TABLE_LENGTH / 2 + BALL_RADIUS * 2.5 &&
          placeZ < TABLE_LENGTH / 2 - BALL_RADIUS * 2.5
        ) {
          // Check clearance from all other active balls
          const hasOverlap = balls.some(ob => {
            if (ob.id === 0 || ob.inPocket) return false;
            const distSq = (ob.x - placeX) * (ob.x - placeX) + (ob.z - placeZ) * (ob.z - placeZ);
            return distSq < (BALL_RADIUS * 2.5) * (BALL_RADIUS * 2.5);
          });

          if (!hasOverlap && pLen < bestPocketDist) {
            bestPocketDist = pLen;
            bestPlacement = { x: placeX, z: placeZ };
          }
        }
      }
    }

    ballInHandPlacement = bestPlacement || { x: 0, z: 0.4 };
  }

  const cuePos = ballInHandPlacement || (cue ? { x: cue.x, z: cue.z } : { x: 0, z: 0.5 });

  // 1. Break Shot logic: powerful, centered strike into the rack apex
  if (isBreakShot) {
    const apex = balls.find(b => b.id === 1) || balls[1];
    const dx = (apex ? apex.x : 0) - cuePos.x;
    const dz = (apex ? apex.z : -0.5) - cuePos.z;
    const baseAngle = Math.atan2(dx, -dz);
    const noise = (Math.random() - 0.5) * persona.aimPrecision * 0.2;

    return {
      angle: baseAngle + noise,
      power: 0.94 + Math.random() * 0.05,
      spinOffset: { x: (Math.random() - 0.5) * 0.15, y: 0.35 },
      targetBallId: apex ? apex.id : 1,
      targetPocket: POCKETS[0],
      isBallInHandPlacement: ballInHandPlacement,
    };
  }

  // 2. Determine legal candidate target balls
  let candidateBalls: BallState[] = [];
  if (mode === '8ball') {
    const activeSolids = balls.filter(b => b.id >= 1 && b.id <= 7 && !b.inPocket);
    const activeStripes = balls.filter(b => b.id >= 9 && b.id <= 15 && !b.inPocket);
    const eightBall = balls.find(b => b.id === 8 && !b.inPocket);

    if (aiGroup === 'solids') {
      candidateBalls = activeSolids.length > 0 ? activeSolids : (eightBall ? [eightBall] : []);
    } else if (aiGroup === 'stripes') {
      candidateBalls = activeStripes.length > 0 ? activeStripes : (eightBall ? [eightBall] : []);
    } else {
      // Open table: can shoot any solid or stripe
      candidateBalls = [...activeSolids, ...activeStripes];
    }
  } else if (mode === '9ball') {
    // Must target lowest active ball
    const activeBalls = balls.filter(b => b.id >= 1 && b.id <= 9 && !b.inPocket);
    if (activeBalls.length > 0) {
      activeBalls.sort((a, b) => a.id - b.id);
      candidateBalls = [activeBalls[0]];
    }
  } else {
    candidateBalls = balls.filter(b => b.id !== 0 && !b.inPocket);
  }

  if (candidateBalls.length === 0) {
    candidateBalls = balls.filter(b => b.id !== 0 && !b.inPocket);
  }

  // 3. Score every (target ball, pocket) pair with scratch avoidance & human shot quality
  interface CandidateShot {
    ball: BallState;
    pocket: typeof POCKETS[0];
    ghostPos: { x: number; z: number };
    aimAngle: number;
    cutAngle: number;
    distToGhost: number;
    distToPocket: number;
    wouldScratch: boolean;
    score: number;
  }

  const validShots: CandidateShot[] = [];

  for (const b of candidateBalls) {
    for (const p of POCKETS) {
      const ghost = getGhostBallPosition(b, p);

      // Cue to Ghost vector
      const cdx = ghost.x - cuePos.x;
      const cdz = ghost.z - cuePos.z;
      const distToGhost = Math.sqrt(cdx * cdx + cdz * cdz);
      if (distToGhost < 0.05) continue;

      // Target to Pocket vector
      const pdx = p.x - b.x;
      const pdz = p.z - b.z;
      const distToPocket = Math.sqrt(pdx * pdx + pdz * pdz);

      // Unit vectors
      const cueDirX = cdx / distToGhost;
      const cueDirZ = cdz / distToGhost;
      const shotDirX = pdx / distToPocket;
      const shotDirZ = pdz / distToPocket;

      // Cut angle cosine (alignment between cue approach and pocket direction)
      const cosCut = cueDirX * shotDirX + cueDirZ * shotDirZ;
      if (cosCut < 0.15) {
        // Cut angle too extreme (>81 degrees)
        continue;
      }

      // Check if cue path to ghost ball is clear
      const cueClear = isPathClear(cuePos, ghost, balls, [0, b.id]);
      if (!cueClear && difficulty !== 'beginner') continue;

      // Check if ball path to pocket is clear
      const pocketClear = isPathClear(b, p, balls, [0, b.id]);
      if (!pocketClear && difficulty !== 'beginner') continue;

      // Scratch evaluation: calculate tangent path of cue ball after collision
      const normalX = (b.x - ghost.x) / BALL_DIAMETER;
      const normalZ = (b.z - ghost.z) / BALL_DIAMETER;
      const tangentX = -normalZ;
      const tangentZ = normalX;

      // Check if tangent line points toward any pocket
      let wouldScratch = false;
      for (const checkP of POCKETS) {
        const toPockX = checkP.x - b.x;
        const toPockZ = checkP.z - b.z;
        const distPock = Math.sqrt(toPockX * toPockX + toPockZ * toPockZ);
        if (distPock > 0.1 && distPock < 1.2) {
          const dot = (tangentX * toPockX + tangentZ * toPockZ) / distPock;
          if (Math.abs(dot) > 0.94) {
            wouldScratch = true;
            break;
          }
        }
      }

      // If shooting the 8-ball, scratches result in immediate loss! Heavily penalize
      if (b.id === 8 && wouldScratch) {
        continue;
      }

      const aimAngle = Math.atan2(cdx, -cdz);

      // Human pro shot score calculation:
      // High reward for straight shots, short pots to pocket, and safe scratch-free paths
      let score = (cosCut * 160) - (distToGhost * 16) - (distToPocket * 22);
      if (cosCut > 0.75) score += 45; // very straight pot
      if (distToPocket < 0.45) score += 60; // ball sitting right near pocket mouth
      if (p.isCorner) score += 15;
      if (wouldScratch) score -= 140;

      validShots.push({
        ball: b,
        pocket: p,
        ghostPos: ghost,
        aimAngle,
        cutAngle: Math.acos(Math.min(1, Math.max(-1, cosCut))),
        distToGhost,
        distToPocket,
        wouldScratch,
        score,
      });
    }
  }

  // Sort best shots first
  validShots.sort((a, b) => b.score - a.score);

  let chosenShot: CandidateShot | null = validShots[0] || null;

  let finalAngle = 0;
  let finalPower = 0.5;
  let targetId = candidateBalls[0]?.id || 1;
  let targetP = POCKETS[0];
  const spinOffset = { x: 0, y: 0 };

  if (chosenShot) {
    targetId = chosenShot.ball.id;
    targetP = chosenShot.pocket;
    finalAngle = chosenShot.aimAngle;

    // Controlled human potting speed:
    // Short pots: soft touch (0.30 - 0.45) for large pocket mouth tolerance
    // Long pots: crisp follow-through (0.50 - 0.75)
    const totalDist = chosenShot.distToGhost + chosenShot.distToPocket;
    if (totalDist < 0.7) {
      finalPower = 0.32 + Math.random() * 0.08;
    } else if (totalDist < 1.3) {
      finalPower = 0.45 + (totalDist - 0.7) * 0.25;
    } else {
      finalPower = Math.min(0.85, 0.60 + (totalDist - 1.3) * 0.2);
    }

    // Smart English and Draw / Follow spin to control cue ball
    if (chosenShot.wouldScratch) {
      // Draw heavily backwards to disrupt scratch path
      spinOffset.y = -0.6;
      spinOffset.x = (Math.random() - 0.5) * 0.3;
    } else if (chosenShot.cutAngle > 0.35 && Math.random() < persona.spinUsage) {
      // Gentle follow/draw for optimal positioning
      spinOffset.y = Math.random() > 0.5 ? 0.35 : -0.35;
      spinOffset.x = (Math.random() - 0.5) * 0.25;
    }
  } else {
    // 4. Human Safety Shot Fallback:
    // When no clear pocket exists, play a deliberate safety shot:
    // Tap legal object ball gently and tuck cue ball near a rail or behind clutter
    const fallbackBall = candidateBalls[0];
    if (fallbackBall) {
      targetId = fallbackBall.id;
      const dx = fallbackBall.x - cuePos.x;
      const dz = fallbackBall.z - cuePos.z;
      finalAngle = Math.atan2(dx, -dz);
      // Soft controlled defensive pace
      finalPower = 0.32 + Math.random() * 0.1;
      spinOffset.y = -0.3;
    }
  }

  // Apply subtle human personality aim deviation (Legend is pinpoint, normal is skilled human)
  const angleError = (Math.random() - 0.5) * 2 * persona.aimPrecision;
  finalAngle += angleError;

  return {
    angle: finalAngle,
    power: Math.min(1.0, Math.max(0.25, finalPower)),
    spinOffset,
    targetBallId: targetId,
    targetPocket: targetP,
    isBallInHandPlacement: ballInHandPlacement,
  };
}
