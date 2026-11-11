/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 
  | '8ball' 
  | '9ball' 
  | 'practice' 
  | 'time_challenge' 
  | 'trick_shot';

export type MatchType = 
  | 'ai' 
  | 'pass_and_play' 
  | 'hotspot_p2p' 
  | 'solo';

export type AIDifficulty = 
  | 'beginner' 
  | 'easy' 
  | 'normal' 
  | 'pro' 
  | 'legend';

export type BallType = 'cue' | 'solid' | 'stripe' | 'eight' | 'nine';

export interface BallState {
  id: number; // 0 = cue ball, 1-7 = solids, 8 = eight ball, 9-15 = stripes
  type: BallType;
  x: number;
  y: number; // elevation (radius when on table, lower when falling into pocket)
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spinX: number; // angular velocity around X
  spinY: number; // angular velocity around Y (side spin / english)
  spinZ: number; // angular velocity around Z
  rotX: number;
  rotY: number;
  rotZ: number;
  inPocket: boolean;
  pocketDropProgress: number; // 0 to 1 as it falls
}

export type PlayerGroup = 'solids' | 'stripes' | 'unassigned';

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  coins: number;
  selectedCueId: string;
  selectedTableFelt: string;
  selectedTableFrame: string;
  selectedBallSkin: string;
  matchesWon: number;
  matchesLost: number;
  ballsPottedTotal: number;
  tournamentsWon: number;
  highestStreak: number;
  currentStreak: number;
}

export interface CueItem {
  id: string;
  name: string;
  arabicName?: string;
  price: number;
  unlocked: boolean;
  power: number; // 1-5
  aimLength: number; // 1-5
  spinControl: number; // 1-5
  description: string;
  arabicDescription?: string;
  primaryColor: string;
  accentColor: string;
  shaftMaterial: 'birch' | 'maple' | 'carbon' | 'gold' | 'neon' | 'obsidian';
  tier?: 'starter' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export interface TableSkin {
  id: string;
  name: string;
  arabicName?: string;
  price: number;
  unlocked: boolean;
  feltColor: string;
  feltRoughness: number;
  frameColor: string;
  frameMaterial: 'mahogany' | 'ebony' | 'carbon' | 'gold' | 'cyber';
  accentColor: string;
  textureUrl?: string;
}

export interface BallSkin {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  style: 'classic' | 'neon' | 'vintage' | 'pearl';
}

export interface AimState {
  angle: number; // in radians (around Y axis)
  power: number; // 0 to 1
  spinOffset: { x: number; y: number }; // -1 to 1 (english and follow/draw)
  elevationAngle: number; // slight cue elevation
}

export interface TrajectoryPoint {
  x: number;
  z: number;
}

export interface TrajectoryPrediction {
  cueLine: TrajectoryPoint[];
  ghostCuePos: { x: number; z: number } | null;
  targetBallId: number | null;
  targetBallLine: TrajectoryPoint[];
  deflectionCueLine: TrajectoryPoint[];
  targetPocket: { x: number; z: number } | null;
  scratchRisk: boolean;
}

export interface AIPersona {
  id: string;
  name: string;
  title: string;
  avatar: string;
  difficulty: AIDifficulty;
  aimPrecision: number; // rad error variance (lower is sharper)
  powerControl: number; // 0 to 1
  safetyShotProbability: number;
  spinUsage: number;
  quips: {
    start: string[];
    goodShot: string[];
    miss: string[];
    win: string[];
    lose: string[];
  };
}

export type TournamentRound = 1 | 2 | 3 | 4 | 5;

export interface TournamentMatch {
  round: TournamentRound; // 1 = Round of 32 (32 players), 2 = Round of 16 (16), 3 = Quarters (8), 4 = Semis (4), 5 = Grand Final (2)
  matchIndex: number;
  player1: { name: string; avatar: string; isUser: boolean };
  player2: { name: string; avatar: string; isUser: boolean };
  winner: string | null;
}

export interface P2PMessage {
  type: 
    | 'SYNC_LOBBY' 
    | 'SHOT_PREVIEW' 
    | 'SHOT_EXECUTE' 
    | 'BALL_IN_HAND' 
    | 'SYNC_BALLS' 
    | 'EMOTE' 
    | 'REMATCH_VOTE' 
    | 'REMATCH'
    | 'TIMEOUT_FOUL'
    | 'CHAT';
  senderId: string;
  payload: any;
  timestamp: number;
}

export interface ShotResult {
  pottedBallIds: number[];
  firstContactBallId: number | null;
  cushionHitsAfterContact: number;
  isScratch: boolean;
  isFoul: boolean;
  foulReason?: string;
  gameOver: boolean;
  winnerPlayerIndex?: number;
}
