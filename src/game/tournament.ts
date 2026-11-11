/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TournamentMatch, TournamentRound, AIDifficulty } from './types';
import { storage, TournamentGiftData } from './storage';

export interface TournamentPlayer {
  id: string;
  name: string;
  nameAr: string;
  avatar: string;
  flag: string;
  level: number;
  difficulty: AIDifficulty;
  isUser: boolean;
}

// Full roster of 35+ diverse cartoon and master characters for 32-player tournament bracket
export const RANDOM_TOURNAMENT_POOL: Omit<TournamentPlayer, 'isUser'>[] = [
  { id: 'p1', name: 'Flash Miller', nameAr: 'البرق ميلر', avatar: '⚡', flag: '🇪🇬', level: 8, difficulty: 'easy' },
  { id: 'p2', name: 'Falcon Ziad', nameAr: 'صقر الصحراء زياد', avatar: '🦅', flag: '🇸🇦', level: 14, difficulty: 'normal' },
  { id: 'p3', name: 'Sniper Rex', nameAr: 'القناص ريكس', avatar: '🎯', flag: '🇦🇪', level: 19, difficulty: 'normal' },
  { id: 'p4', name: 'King Karim', nameAr: 'الملك كريم', avatar: '👑', flag: '🇲🇦', level: 25, difficulty: 'pro' },
  { id: 'p5', name: 'Dragon Drake', nameAr: 'تنين الكرات دريك', avatar: '🐉', flag: '🇯🇴', level: 17, difficulty: 'normal' },
  { id: 'p6', name: 'Princess Sofia', nameAr: 'أميرة البلياردو صوفيا', avatar: '👸', flag: '🇪🇸', level: 12, difficulty: 'easy' },
  { id: 'p7', name: 'Shadow Ghost', nameAr: 'شبح الطاولة الأسود', avatar: '👻', flag: '🇺🇸', level: 22, difficulty: 'pro' },
  { id: 'p8', name: 'Maestro Chen', nameAr: 'المايسترو تشين', avatar: '🎩', flag: '🇨🇳', level: 28, difficulty: 'legend' },
  { id: 'p9', name: 'Titan Boris', nameAr: 'العملاق بوريس', avatar: '🔨', flag: '🇩🇪', level: 16, difficulty: 'normal' },
  { id: 'p10', name: 'Joker Vance', nameAr: 'الجوكر الساحر', avatar: '🃏', flag: '🇬🇧', level: 21, difficulty: 'pro' },
  { id: 'p11', name: 'Tiger Leo', nameAr: 'النمر المقاتل ليو', avatar: '🐯', flag: '🇧🇷', level: 15, difficulty: 'normal' },
  { id: 'p12', name: 'Boss Tarek', nameAr: 'الزعيم طارق', avatar: '🕶️', flag: '🇩🇿', level: 24, difficulty: 'pro' },
  { id: 'p13', name: 'Cyber Nova', nameAr: 'سايبر نوفا', avatar: '🤖', flag: '🇯🇵', level: 20, difficulty: 'pro' },
  { id: 'p14', name: 'Captain Zaki', nameAr: 'الكابتن زكي', avatar: '🧢', flag: '🇰🇼', level: 9, difficulty: 'easy' },
  { id: 'p15', name: 'Sultan Fahad', nameAr: 'السلطان فهد', avatar: '🦁', flag: '🇶🇦', level: 23, difficulty: 'pro' },
  { id: 'p16', name: 'Cheetah Rami', nameAr: 'الفهد رامي', avatar: '🐆', flag: '🇧🇭', level: 18, difficulty: 'normal' },
  { id: 'p17', name: 'Cobra Nader', nameAr: 'الكوبرا نادر', avatar: '🐍', flag: '🇴🇲', level: 13, difficulty: 'easy' },
  { id: 'p18', name: 'Knight Wissam', nameAr: 'الفارس وسام', avatar: '🛡️', flag: '🇱🇧', level: 26, difficulty: 'pro' },
  { id: 'p19', name: 'Phoenix Youssef', nameAr: 'العنقاء يوسف', avatar: '🔥', flag: '🇹🇳', level: 21, difficulty: 'normal' },
  { id: 'p20', name: 'Wolf Haydar', nameAr: 'الذئب حيدر', avatar: '🐺', flag: '🇮🇶', level: 27, difficulty: 'legend' },
  { id: 'p21', name: 'Falcon Majd', nameAr: 'شاهين مجد', avatar: '🪶', flag: '🇸🇾', level: 16, difficulty: 'normal' },
  { id: 'p22', name: 'Scorpion Murad', nameAr: 'العقرب مراد', avatar: '🦂', flag: '🇱🇾', level: 14, difficulty: 'easy' },
  { id: 'p23', name: 'Rhino Adam', nameAr: 'وحيد القرن آدم', avatar: '🦏', flag: '🇸🇩', level: 19, difficulty: 'normal' },
  { id: 'p24', name: 'Bear Oleg', nameAr: 'الدب أوليغ', avatar: '🐻', flag: '🇷🇺', level: 22, difficulty: 'pro' },
  { id: 'p25', name: 'Viking Erik', nameAr: 'الفايكنغ إيريك', avatar: '⚔️', flag: '🇸🇪', level: 25, difficulty: 'pro' },
  { id: 'p26', name: 'Gladiator Marco', nameAr: 'المحارب ماركو', avatar: '🏛️', flag: '🇮🇹', level: 17, difficulty: 'normal' },
  { id: 'p27', name: 'Phantom Jack', nameAr: 'الروح جاك', avatar: '🌪️', flag: '🇦🇺', level: 29, difficulty: 'legend' },
  { id: 'p28', name: 'Jaguar Mateo', nameAr: 'الجاغوار ماتيو', avatar: '🐾', flag: '🇲🇽', level: 15, difficulty: 'normal' },
  { id: 'p29', name: 'Samurai Kenji', nameAr: 'الساموراي كينجي', avatar: '⛩️', flag: '🇯🇵', level: 30, difficulty: 'legend' },
  { id: 'p30', name: 'Ace Lucas', nameAr: 'الورقة الرابحة لوكاس', avatar: '🂡', flag: '🇨🇦', level: 20, difficulty: 'pro' },
  { id: 'p31', name: 'Wizard Arthur', nameAr: 'الساحر آرثر', avatar: '🔮', flag: '🇫🇷', level: 23, difficulty: 'pro' },
  { id: 'p32', name: 'Blaze Omar', nameAr: 'الشعلة عمر', avatar: '💥', flag: '🇾🇪', level: 11, difficulty: 'easy' },
  { id: 'p33', name: 'Hunter Samer', nameAr: 'الصياد سامر', avatar: '🏹', flag: '🇵🇸', level: 18, difficulty: 'normal' },
  { id: 'p34', name: 'Panther Reda', nameAr: 'الفهد الأسود رضا', avatar: '🐈‍⬛', flag: '🇲🇷', level: 15, difficulty: 'normal' },
  { id: 'p35', name: 'Captain Lucas', nameAr: 'القبطان لوكاس', avatar: '⚓', flag: '🇬🇷', level: 16, difficulty: 'normal' },
];

const STORAGE_KEY_TOURNAMENT_STATE = 'pool_legends_tournament_state_v2';

export interface TournamentState {
  currentRound: TournamentRound;
  matches: TournamentMatch[];
  isCompleted: boolean;
  wonByPlayer: boolean;
  prizeAwarded: TournamentGiftData | null;
}

// Generate a 32-player knockout bracket with the user + 31 random opponents (16 matches in Round 1)
export function createNewTournament(user: { name: string; avatar: string; level: number }): TournamentState {
  // Shuffle pool and pick 31 unique opponents
  const shuffled = [...RANDOM_TOURNAMENT_POOL].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 31);

  const userPlayer = {
    name: user.name,
    avatar: user.avatar,
    isUser: true,
  };

  const opponents = picked.map(p => ({
    name: p.name,
    avatar: p.avatar,
    isUser: false,
  }));

  // Round of 32 (Round 1): 16 matches, 32 total contenders
  const round1Matches: TournamentMatch[] = [];

  // Match 0: User vs Opponent 0
  round1Matches.push({
    round: 1,
    matchIndex: 0,
    player1: userPlayer,
    player2: opponents[0],
    winner: null,
  });

  // Matches 1 to 15: Opponents paired 2 by 2
  for (let i = 1; i < 16; i++) {
    const p1Idx = (i * 2) - 1;
    const p2Idx = i * 2;
    round1Matches.push({
      round: 1,
      matchIndex: i,
      player1: opponents[p1Idx],
      player2: opponents[p2Idx],
      winner: null,
    });
  }

  const newState: TournamentState = {
    currentRound: 1,
    matches: round1Matches,
    isCompleted: false,
    wonByPlayer: false,
    prizeAwarded: null,
  };

  saveTournamentState(newState);
  return newState;
}

export function getSavedTournamentState(): TournamentState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TOURNAMENT_STATE);
    if (data) return JSON.parse(data);
  } catch {}
  return null;
}

export function saveTournamentState(state: TournamentState | null) {
  try {
    if (state) {
      localStorage.setItem(STORAGE_KEY_TOURNAMENT_STATE, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY_TOURNAMENT_STATE);
    }
  } catch {}
}

// Simulate other AI matches in the current round so other brackets progress
export function simulateOtherMatches(currentRound: TournamentRound, matches: TournamentMatch[]): TournamentMatch[] {
  return matches.map(m => {
    if (m.round !== currentRound) return m;
    // Don't overwrite match with user or already finished match
    if (m.player1.isUser || m.player2.isUser || m.winner) return m;

    // Pick random winner between the two AI players
    const winnerName = Math.random() > 0.5 ? m.player1.name : m.player2.name;
    return {
      ...m,
      winner: winnerName,
    };
  });
}

// Helper to determine the winner player object of a completed match
function getMatchWinnerPlayer(match: TournamentMatch): { name: string; avatar: string; isUser: boolean } {
  if (match.player1.isUser) return match.player1;
  if (match.player2.isUser) return match.player2;
  if (match.winner === match.player1.name) return match.player1;
  return match.player2;
}

// Advances the 32-player tournament to the next knockout round
// Round 1 (32 players, 16 matches) -> Round 2 (16 players, 8 matches)
// Round 2 (16 players, 8 matches)  -> Round 3 (8 players, 4 matches - Quarters)
// Round 3 (8 players, 4 matches)   -> Round 4 (4 players, 2 matches - Semis)
// Round 4 (4 players, 2 matches)   -> Round 5 (2 players, 1 match - Grand Final)
// Round 5 (Final won!)             -> Champion!
export function advanceToNextRound(
  currentRound: TournamentRound, 
  currentMatches: TournamentMatch[]
): { nextRound: TournamentRound; updatedMatches: TournamentMatch[]; isChampion: boolean } {
  // First simulate all non-user matches in the current round
  const simulatedMatches = simulateOtherMatches(currentRound, currentMatches);

  if (currentRound === 5) {
    // Grand Final Won!
    return { nextRound: 5, updatedMatches: simulatedMatches, isChampion: true };
  }

  const nextRound = (currentRound + 1) as TournamentRound;
  const currentRoundMatches = simulatedMatches
    .filter(m => m.round === currentRound)
    .sort((a, b) => a.matchIndex - b.matchIndex);

  const nextMatchesCount = currentRoundMatches.length / 2;
  const nextRoundMatches: TournamentMatch[] = [];

  for (let i = 0; i < nextMatchesCount; i++) {
    const matchA = currentRoundMatches[i * 2];
    const matchB = currentRoundMatches[i * 2 + 1];

    const winnerA = matchA ? getMatchWinnerPlayer(matchA) : { name: 'Player A', avatar: '🎱', isUser: false };
    const winnerB = matchB ? getMatchWinnerPlayer(matchB) : { name: 'Player B', avatar: '🎱', isUser: false };

    nextRoundMatches.push({
      round: nextRound,
      matchIndex: i,
      player1: winnerA,
      player2: winnerB,
      winner: null,
    });
  }

  const allMatches = [...simulatedMatches, ...nextRoundMatches];
  const newState: TournamentState = {
    currentRound: nextRound,
    matches: allMatches,
    isCompleted: false,
    wonByPlayer: false,
    prizeAwarded: null,
  };
  saveTournamentState(newState);

  return { nextRound, updatedMatches: allMatches, isChampion: false };
}

// Generate tournament champion gift: Exclusive pool cue for tournament champion
export function generateRandomTournamentPrize(): TournamentGiftData {
  const lockedCues = storage.getLockedCues();
  const shouldAwardCue = lockedCues.length > 0;

  if (shouldAwardCue) {
    const randomCue = lockedCues[Math.floor(Math.random() * lockedCues.length)];
    const gift: TournamentGiftData = {
      id: 'gift_' + Date.now(),
      type: 'cue',
      cueId: randomCue.id,
      cueName: randomCue.name,
      cueArabicName: randomCue.arabicName || randomCue.name,
      cueTier: randomCue.tier || 'legendary',
      claimed: false,
      date: Date.now(),
    };
    storage.saveTournamentGift(gift);
    return gift;
  } else {
    // All catalog cues unlocked: award prestigious Excalibur cue skin
    const gift: TournamentGiftData = {
      id: 'gift_' + Date.now(),
      type: 'cue',
      cueId: 'cue_excalibur',
      cueName: 'Excalibur Royal Gold',
      cueArabicName: 'إكسكاليبر الملكية الذهبية',
      cueTier: 'legendary',
      claimed: false,
      date: Date.now(),
    };
    storage.saveTournamentGift(gift);
    return gift;
  }
}
