/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BallState, PlayerGroup, ShotResult } from './types';
import { sounds } from './audio';
import { BALL_RADIUS } from './physics';

export interface GameRulesState {
  mode: '8ball' | '9ball' | 'practice' | 'time_challenge' | 'trick_shot';
  currentPlayerIndex: number; // 0 = Player 1, 1 = Player 2 / AI
  playerGroups: [PlayerGroup, PlayerGroup]; // [Player 1 group, Player 2 group]
  isBreakShot: boolean;
  isBallInHand: boolean;
  firstContactBallId: number | null;
  cushionHitsThisShot: number;
  winnerPlayerIndex: number | null;
  gameOver: boolean;
  statusMessage: string;
}

export function createInitialRulesState(mode: '8ball' | '9ball' | 'practice' | 'time_challenge' | 'trick_shot'): GameRulesState {
  return {
    mode,
    currentPlayerIndex: 0,
    playerGroups: ['unassigned', 'unassigned'],
    isBreakShot: true,
    isBallInHand: false,
    firstContactBallId: null,
    cushionHitsThisShot: 0,
    winnerPlayerIndex: null,
    gameOver: false,
    statusMessage: 'Break Shot: Take your opening break!',
  };
}

// Evaluate shot results and determine fouls, group assignments, turn handovers, or game over
export function evaluateShot(
  state: GameRulesState,
  balls: BallState[],
  pottedBallIdsThisShot: number[],
  firstContactBallId: number | null,
  cushionHitsAfterContact: number
): { newState: GameRulesState; result: ShotResult } {
  const newState: GameRulesState = { ...state };
  const currentIdx = state.currentPlayerIndex;
  const opponentIdx = currentIdx === 0 ? 1 : 0;
  const playerGroup = state.playerGroups[currentIdx];

  let isFoul = false;
  let foulReason = '';
  let shouldSwitchTurn = false;
  let isScratch = pottedBallIdsThisShot.includes(0);

  // Scratch check
  if (isScratch) {
    isFoul = true;
    foulReason = 'Scratch: Cue ball pocketed!';
  }

  // Airball (no ball hit)
  if (!isFoul && firstContactBallId === null) {
    isFoul = true;
    foulReason = 'Foul: No ball contacted!';
  }

  if (state.mode === '8ball') {
    // Count remaining balls for each group BEFORE and AFTER this shot
    // Balls potted during this shot were active on the table when the player aimed and hit!
    const remainingSolidsBeforeShot = balls.filter(b => b.id >= 1 && b.id <= 7 && (!b.inPocket || pottedBallIdsThisShot.includes(b.id)));
    const remainingStripesBeforeShot = balls.filter(b => b.id >= 9 && b.id <= 15 && (!b.inPocket || pottedBallIdsThisShot.includes(b.id)));

    const remainingSolidsAfterShot = balls.filter(b => b.id >= 1 && b.id <= 7 && !b.inPocket);
    const remainingStripesAfterShot = balls.filter(b => b.id >= 9 && b.id <= 15 && !b.inPocket);
    const isEightBallInPocket = pottedBallIdsThisShot.includes(8);

    // 8-Ball pocketed checks
    if (isEightBallInPocket) {
      const myGroup = newState.playerGroups[currentIdx];
      const myRemainingBeforeShot = myGroup === 'solids' ? remainingSolidsBeforeShot : remainingStripesBeforeShot;
      const hasClearedMyGroup = (myGroup !== 'unassigned') && (myRemainingBeforeShot.length === 0);

      if (isScratch || isFoul) {
        // Scratched or fouled on 8-ball = Instant Loss!
        newState.gameOver = true;
        newState.winnerPlayerIndex = opponentIdx;
        newState.statusMessage = `Foul on the 8-Ball! Player ${opponentIdx + 1} Wins!`;
      } else if (!hasClearedMyGroup && myGroup !== 'unassigned') {
        // Pocketed 8-ball too early = Instant Loss!
        newState.gameOver = true;
        newState.winnerPlayerIndex = opponentIdx;
        newState.statusMessage = `8-Ball pocketed before clearing group! Player ${opponentIdx + 1} Wins!`;
      } else if (state.isBreakShot) {
        // 8-ball on break = Instant Win or Respot depending on rules, we grant Epic Win!
        newState.gameOver = true;
        newState.winnerPlayerIndex = currentIdx;
        newState.statusMessage = `EPIC BREAK! 8-Ball pocketed on the break! Player ${currentIdx + 1} Wins!`;
      } else {
        // Legitimate 8-Ball win!
        newState.gameOver = true;
        newState.winnerPlayerIndex = currentIdx;
        newState.statusMessage = `8-Ball potted cleanly! Player ${currentIdx + 1} Wins!`;
      }

      sounds.playVictory();
      return {
        newState,
        result: {
          pottedBallIds: pottedBallIdsThisShot,
          firstContactBallId,
          cushionHitsAfterContact,
          isScratch,
          isFoul,
          foulReason,
          gameOver: true,
          winnerPlayerIndex: newState.winnerPlayerIndex ?? undefined,
        }
      };
    }

    // First contact checks for 8-ball
    if (!isFoul && firstContactBallId !== null && playerGroup !== 'unassigned') {
      const myRemainingBefore = playerGroup === 'solids' ? remainingSolidsBeforeShot : remainingStripesBeforeShot;
      const isMyBall = playerGroup === 'solids' ? (firstContactBallId >= 1 && firstContactBallId <= 7) : (firstContactBallId >= 9 && firstContactBallId <= 15);

      if (myRemainingBefore.length > 0) {
        if (!isMyBall) {
          isFoul = true;
          foulReason = `Foul: Must strike your own ${playerGroup} first!`;
        }
      } else {
        // All balls cleared prior to this shot: player must target the 8-ball directly
        if (firstContactBallId !== 8) {
          isFoul = true;
          foulReason = 'Foul: Must strike the 8-Ball!';
        }
      }
    }

    // Group Assignment on open table
    if (!isFoul && playerGroup === 'unassigned' && pottedBallIdsThisShot.length > 0) {
      const pottedSolids = pottedBallIdsThisShot.filter(id => id >= 1 && id <= 7);
      const pottedStripes = pottedBallIdsThisShot.filter(id => id >= 9 && id <= 15);

      if (pottedSolids.length > 0 && pottedStripes.length === 0) {
        newState.playerGroups[currentIdx] = 'solids';
        newState.playerGroups[opponentIdx] = 'stripes';
        newState.statusMessage = `Player ${currentIdx + 1} is SOLIDS! Player ${opponentIdx + 1} is STRIPES!`;
      } else if (pottedStripes.length > 0 && pottedSolids.length === 0) {
        newState.playerGroups[currentIdx] = 'stripes';
        newState.playerGroups[opponentIdx] = 'solids';
        newState.statusMessage = `Player ${currentIdx + 1} is STRIPES! Player ${opponentIdx + 1} is SOLIDS!`;
      }
    }

    // Check if player potted the opponent's ball
    const assignedGroup = newState.playerGroups[currentIdx];
    let pottedOpponentBall = false;
    if (assignedGroup === 'solids') {
      pottedOpponentBall = pottedBallIdsThisShot.some(id => id >= 9 && id <= 15);
    } else if (assignedGroup === 'stripes') {
      pottedOpponentBall = pottedBallIdsThisShot.some(id => id >= 1 && id <= 7);
    }

    if (!isFoul && pottedOpponentBall) {
      isFoul = true;
      foulReason = 'Foul: Opponent ball pocketed!';
    }

    // Determine turn continuation or switch
    if (isFoul) {
      sounds.playFoul();
      shouldSwitchTurn = true;
      newState.isBallInHand = true;
      if (isScratch) {
        newState.statusMessage = `Scratch! White ball pocketed! Player ${opponentIdx + 1} can position the cue ball anywhere on the table.`;
      } else if (pottedOpponentBall) {
        newState.statusMessage = `Foul: Opponent ball pocketed! Player ${opponentIdx + 1} can position the cue ball anywhere on the table.`;
      } else {
        newState.statusMessage = `${foulReason} Player ${opponentIdx + 1} has Ball in Hand (place anywhere on table).`;
      }
    } else {
      // Did current player legally pocket one of their balls?
      let legallyPocketed = false;
      const assignedGroup = newState.playerGroups[currentIdx];

      if (assignedGroup === 'solids') {
        legallyPocketed = pottedBallIdsThisShot.some(id => id >= 1 && id <= 7);
      } else if (assignedGroup === 'stripes') {
        legallyPocketed = pottedBallIdsThisShot.some(id => id >= 9 && id <= 15);
      } else {
        // Open table: any object ball potted keeps turn
        legallyPocketed = pottedBallIdsThisShot.some(id => id >= 1 && id <= 15 && id !== 8);
      }

      if (legallyPocketed) {
        shouldSwitchTurn = false;
        newState.isBallInHand = false;
        // Check if player now has zero balls remaining after this shot!
        const remainingAfterShot = assignedGroup === 'solids' 
          ? remainingSolidsAfterShot.length
          : remainingStripesAfterShot.length;

        if (remainingAfterShot === 0 && assignedGroup !== 'unassigned') {
          newState.statusMessage = `All balls cleared! Player ${currentIdx + 1} can now pot the black 8-ball directly!`;
        } else {
          newState.statusMessage = `Nice shot! Player ${currentIdx + 1} continues!`;
        }
      } else {
        // Player missed or didn't pocket a ball: pass turn cleanly to opponent without foul
        shouldSwitchTurn = true;
        newState.isBallInHand = false;
        const remainingBefore = assignedGroup === 'solids' ? remainingSolidsBeforeShot.length : remainingStripesBeforeShot.length;
        if (remainingBefore === 0 && assignedGroup !== 'unassigned') {
          newState.statusMessage = `8-Ball missed. Turn passes cleanly to Player ${opponentIdx + 1}.`;
        } else {
          newState.statusMessage = `Turn passes to Player ${opponentIdx + 1}.`;
        }
      }
    }
  } else if (state.mode === '9ball') {
    // 9-Ball Rules: Lowest numbered ball on table must be contacted first
    const activeBalls = balls.filter(b => b.id >= 1 && b.id <= 9 && !b.inPocket);
    const lowestBallId = activeBalls.reduce((min, b) => b.id < min ? b.id : min, 99);

    if (firstContactBallId !== lowestBallId) {
      isFoul = true;
      foulReason = `Foul: Must strike lowest ball (${lowestBallId}) first!`;
    }

    const isNinePotted = pottedBallIdsThisShot.includes(9);
    if (isNinePotted && !isFoul) {
      newState.gameOver = true;
      newState.winnerPlayerIndex = currentIdx;
      newState.statusMessage = `9-BALL POCKETED! Player ${currentIdx + 1} Wins the Match!`;
      sounds.playVictory();
    } else if (isNinePotted && isFoul) {
      // Respot 9-ball on foot spot
      const nineBall = balls.find(b => b.id === 9);
      if (nineBall) {
        nineBall.inPocket = false;
        nineBall.x = 0;
        nineBall.z = -0.5;
        nineBall.vx = 0;
        nineBall.vz = 0;
      }
    }

    if (isFoul) {
      sounds.playFoul();
      shouldSwitchTurn = true;
      newState.isBallInHand = true;
      newState.statusMessage = isScratch
        ? `Scratch! Ball in Hand for Player ${opponentIdx + 1} (place anywhere on table)!`
        : `${foulReason} Ball in Hand for Player ${opponentIdx + 1} (place anywhere on table)!`;
    } else {
      if (pottedBallIdsThisShot.length > 0) {
        shouldSwitchTurn = false;
        newState.isBallInHand = false;
        newState.statusMessage = `Great pot! Player ${currentIdx + 1} continues!`;
      } else {
        shouldSwitchTurn = true;
        newState.isBallInHand = false;
        newState.statusMessage = `Turn passes to Player ${opponentIdx + 1}.`;
      }
    }
  } else {
    // Practice / Trick Shot / Time Challenge
    if (isScratch) {
      sounds.playFoul();
      newState.isBallInHand = true;
      newState.statusMessage = 'Scratch! Place cue ball anywhere to continue.';
    } else if (pottedBallIdsThisShot.length > 0) {
      newState.isBallInHand = false;
      newState.statusMessage = `Potted ${pottedBallIdsThisShot.length} ball(s)!`;
    }
  }

  // Respot cue ball if scratched
  if (isScratch) {
    const cue = balls.find(b => b.id === 0);
    if (cue) {
      cue.inPocket = false;
      cue.x = 0;
      cue.z = 0.5;
      cue.y = BALL_RADIUS;
      cue.vx = 0;
      cue.vz = 0;
      cue.pocketDropProgress = 0;
    }
    newState.isBallInHand = true;
  }

  if (shouldSwitchTurn && !newState.gameOver) {
    newState.currentPlayerIndex = opponentIdx;
  }

  newState.isBreakShot = false;

  return {
    newState,
    result: {
      pottedBallIds: pottedBallIdsThisShot,
      firstContactBallId,
      cushionHitsAfterContact,
      isScratch,
      isFoul,
      foulReason,
      gameOver: newState.gameOver,
      winnerPlayerIndex: newState.winnerPlayerIndex ?? undefined,
    }
  };
}
