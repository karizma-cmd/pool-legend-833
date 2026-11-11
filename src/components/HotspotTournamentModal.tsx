/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Wifi, 
  Users, 
  Play, 
  Crown, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Swords, 
  Sparkles,
  QrCode,
  Share2,
  Copy,
  Check,
  Flame,
  ArrowRight
} from 'lucide-react';
import { PlayerProfile } from '../game/types';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';
import { multiplayer } from '../game/multiplayer';

export interface HotspotTournamentPlayer {
  id: string;
  name: string;
  avatar: string;
}

export interface HotspotTournamentMatch {
  id: string;
  titleAr: string;
  titleEn: string;
  round: 'semi' | 'final';
  player1: HotspotTournamentPlayer;
  player2: HotspotTournamentPlayer;
  winner: HotspotTournamentPlayer | null;
  completed: boolean;
}

export interface HotspotTournamentState {
  playerCount: 2 | 4;
  players: HotspotTournamentPlayer[];
  matches: HotspotTournamentMatch[];
  currentMatchIndex: number;
  isCompleted: boolean;
  champion: HotspotTournamentPlayer | null;
}

const DEFAULT_AVATARS = ['🎱', '⚡', '👑', '🎯', '🦁', '🐯', '🦅', '🐉', '🎩', '🤖'];

interface HotspotTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: PlayerProfile;
  tournamentState: HotspotTournamentState;
  onUpdateTournamentState: (state: HotspotTournamentState) => void;
  onStartMatch: (p1: HotspotTournamentPlayer, p2: HotspotTournamentPlayer, matchTitle: string) => void;
}

export const HotspotTournamentModal: React.FC<HotspotTournamentModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  tournamentState,
  onUpdateTournamentState,
  onStartMatch,
}) => {
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());
  const [playerCount, setPlayerCount] = useState<2 | 4>(tournamentState.playerCount || 4);
  const [modeTab, setModeTab] = useState<'bracket' | 'setup' | 'network'>('bracket');

  // Custom player setup names
  const [p1Name, setP1Name] = useState(tournamentState.players[0]?.name || userProfile.name);
  const [p1Avatar, setP1Avatar] = useState(tournamentState.players[0]?.avatar || userProfile.avatar || '👑');

  const [p2Name, setP2Name] = useState(tournamentState.players[1]?.name || 'صديق 2');
  const [p2Avatar, setP2Avatar] = useState(tournamentState.players[1]?.avatar || '⚡');

  const [p3Name, setP3Name] = useState(tournamentState.players[2]?.name || 'صديق 3');
  const [p3Avatar, setP3Avatar] = useState(tournamentState.players[2]?.avatar || '🎯');

  const [p4Name, setP4Name] = useState(tournamentState.players[3]?.name || 'صديق 4');
  const [p4Avatar, setP4Avatar] = useState(tournamentState.players[3]?.avatar || '🦁');

  // Network Hotspot sharing state
  const [hostRoomCode, setHostRoomCode] = useState<string>('');
  const [hostQrUrl, setHostQrUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  // Build fresh tournament structure
  const handleGenerateTournament = (count: 2 | 4) => {
    sounds.playRack();
    const p1: HotspotTournamentPlayer = { id: 'p1', name: p1Name.trim() || 'Player 1', avatar: p1Avatar };
    const p2: HotspotTournamentPlayer = { id: 'p2', name: p2Name.trim() || 'Player 2', avatar: p2Avatar };
    const p3: HotspotTournamentPlayer = { id: 'p3', name: p3Name.trim() || 'Player 3', avatar: p3Avatar };
    const p4: HotspotTournamentPlayer = { id: 'p4', name: p4Name.trim() || 'Player 4', avatar: p4Avatar };

    const players = count === 2 ? [p1, p2] : [p1, p2, p3, p4];
    const matches: HotspotTournamentMatch[] = [];

    if (count === 2) {
      matches.push({
        id: 'final',
        titleAr: 'المباراة النهائية الكبرى',
        titleEn: 'Grand Championship Final',
        round: 'final',
        player1: p1,
        player2: p2,
        winner: null,
        completed: false,
      });
    } else {
      // 4 Players: 2 Semi-Finals + 1 Grand Final
      matches.push({
        id: 'semi_1',
        titleAr: 'نصف النهائي 1',
        titleEn: 'Semi-Final 1',
        round: 'semi',
        player1: p1,
        player2: p2,
        winner: null,
        completed: false,
      });
      matches.push({
        id: 'semi_2',
        titleAr: 'نصف النهائي 2',
        titleEn: 'Semi-Final 2',
        round: 'semi',
        player1: p3,
        player2: p4,
        winner: null,
        completed: false,
      });
      matches.push({
        id: 'final',
        titleAr: 'المباراة النهائية الكبرى',
        titleEn: 'Grand Championship Final',
        round: 'final',
        player1: { id: 'w1', name: isAr ? 'فائز نصف النهائي 1' : 'Winner of Semi 1', avatar: '🎱' },
        player2: { id: 'w2', name: isAr ? 'فائز نصف النهائي 2' : 'Winner of Semi 2', avatar: '🎱' },
        winner: null,
        completed: false,
      });
    }

    const newState: HotspotTournamentState = {
      playerCount: count,
      players,
      matches,
      currentMatchIndex: 0,
      isCompleted: false,
      champion: null,
    };

    onUpdateTournamentState(newState);
    setModeTab('bracket');
  };

  const handleCreateNetworkRoom = async () => {
    try {
      sounds.playClick();
      setIsCreatingRoom(true);
      const { roomCode, qrUrl } = await multiplayer.createRoom();
      setHostRoomCode(roomCode);
      setHostQrUrl(qrUrl);
    } catch {} finally {
      setIsCreatingRoom(false);
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    sounds.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Find active playable match
  const activeMatch = tournamentState.matches.find(m => !m.completed) || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/90 backdrop-blur-md select-none animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-[0_0_50px_rgba(0,0,0,0.85)] p-3.5 sm:p-5 max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <Trophy size={24} className="fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  {isAr ? 'بطولة الأصدقاء عبر الهوتسبوت' : 'Hotspot Friends Tournament'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                  <Wifi size={10} />
                  <span>2 - 4 PLAYERS</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAr 
                  ? 'تنظيم بطولة تنافسية بين 2 إلى 4 أصدقاء كحد أقصى عبر شبكة الهوتسبوت' 
                  : 'Host an offline local championship between 2 to 4 friends max'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setModeTab('setup');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
              title={isAr ? 'إعادة ضبط البطولة' : 'Reset Tournament'}
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="my-2.5 grid grid-cols-3 gap-1.5 shrink-0">
          <button
            onClick={() => { sounds.playClick(); setModeTab('bracket'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              modeTab === 'bracket'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Trophy size={14} />
            <span>{isAr ? 'جدول البطولة' : 'Tournament Bracket'}</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setModeTab('setup'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              modeTab === 'setup'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users size={14} />
            <span>{isAr ? 'اللاعبين (2 أو 4)' : 'Players Setup (2 or 4)'}</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setModeTab('network'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              modeTab === 'network'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Wifi size={14} />
            <span>{isAr ? 'مشاركة الهوتسبوت' : 'Hotspot Room'}</span>
          </button>
        </div>

        {/* Tab 1: Tournament Bracket & Matches */}
        {modeTab === 'bracket' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* Champion Banner if completed */}
            {tournamentState.champion && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-yellow-900/50 to-amber-950/80 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] text-center animate-bounce-short">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center text-3xl shadow-lg border-2 border-yellow-200">
                  {tournamentState.champion.avatar}
                </div>
                <div className="mt-2 text-base sm:text-lg font-black text-amber-300 flex items-center justify-center gap-2">
                  <Crown size={18} className="text-yellow-300 fill-current" />
                  <span>{isAr ? `تُوِّج ${tournamentState.champion.name} بطلاً لبطولة الأصدقاء!` : `${tournamentState.champion.name} is the Tournament Champion!`}</span>
                </div>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  {isAr ? 'تهانينا للبطل! يمكنك إعادة تشغيل بطولة جديدة في أي وقت.' : 'Congratulations Champion! You conquered the Hotspot Championship.'}
                </p>
              </div>
            )}

            {/* Matches List */}
            <div className="space-y-2.5">
              {tournamentState.matches.map((m, idx) => {
                const isCurrentPlayable = !m.completed && (!tournamentState.matches[idx - 1] || tournamentState.matches[idx - 1].completed);

                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isCurrentPlayable
                        ? 'bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50'
                        : m.completed
                        ? 'bg-slate-900/90 border-emerald-500/40 opacity-90'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="px-3 py-1.5 flex items-center justify-between text-xs border-b border-slate-800/80 bg-slate-950/50">
                      <span className="font-extrabold text-amber-400">
                        {isAr ? m.titleAr : m.titleEn}
                      </span>
                      {m.completed ? (
                        <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> {isAr ? `تأهل: ${m.winner?.name}` : `Winner: ${m.winner?.name}`}
                        </span>
                      ) : isCurrentPlayable ? (
                        <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 animate-pulse flex items-center gap-1">
                          <Flame size={11} className="fill-current" />
                          {isAr ? 'جاهزة للعب الآن' : 'Ready to Play'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          {isAr ? 'في انتظار الأدوار السابقة' : 'Waiting'}
                        </span>
                      )}
                    </div>

                    <div className="p-3 grid grid-cols-11 gap-2 items-center">
                      {/* Player 1 */}
                      <div className={`col-span-5 p-2 rounded-xl border flex items-center gap-2 ${
                        m.winner?.id === m.player1.id
                          ? 'bg-emerald-950/50 border-emerald-400 text-emerald-200'
                          : m.completed
                          ? 'bg-slate-900 border-slate-800 opacity-60 line-through'
                          : 'bg-slate-900 border-slate-700 text-white'
                      }`}>
                        <span className="text-xl shrink-0">{m.player1.avatar}</span>
                        <div className="min-w-0 flex-1 truncate font-bold text-xs">
                          {m.player1.name}
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="col-span-1 text-center font-black text-[11px] text-slate-400">
                        VS
                      </div>

                      {/* Player 2 */}
                      <div className={`col-span-5 p-2 rounded-xl border flex items-center gap-2 ${
                        m.winner?.id === m.player2.id
                          ? 'bg-emerald-950/50 border-emerald-400 text-emerald-200'
                          : m.completed
                          ? 'bg-slate-900 border-slate-800 opacity-60 line-through'
                          : 'bg-slate-900 border-slate-700 text-white'
                      }`}>
                        <span className="text-xl shrink-0">{m.player2.avatar}</span>
                        <div className="min-w-0 flex-1 truncate font-bold text-xs">
                          {m.player2.name}
                        </div>
                      </div>
                    </div>

                    {/* Direct Play Button for Active Match */}
                    {isCurrentPlayable && (
                      <div className="px-3 pb-3 pt-1 flex justify-end">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onStartMatch(m.player1, m.player2, isAr ? m.titleAr : m.titleEn);
                            onClose();
                          }}
                          className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                        >
                          <Play size={14} fill="currentColor" />
                          <span>{isAr ? `بدء المباراة: ${m.player1.name} ضد ${m.player2.name}` : `Play Match: ${m.player1.name} vs ${m.player2.name}`}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Players Setup (2 or 4 Players) */}
        {modeTab === 'setup' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Player Count Selection */}
            <div>
              <label className="text-xs font-black text-slate-300 block mb-1.5">
                {isAr ? 'عدد الأصدقاء المتنافسين (2 كحد أدنى أو 4 كحد أقصى):' : 'Number of Players (2 to 4 max):'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setPlayerCount(2); }}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    playerCount === 2
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow ring-1 ring-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-lg font-black text-amber-300">2 {isAr ? 'لاعبين' : 'Players'}</div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {isAr ? 'مباراة نهائية مباشرة وحاسمة بين صديقين' : 'Direct Final match between 2 friends'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setPlayerCount(4); }}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    playerCount === 4
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow ring-1 ring-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-lg font-black text-amber-300">4 {isAr ? 'لاعبين (الحد الأقصى)' : 'Players (Max)'}</div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {isAr ? 'نصف نهائي 1 + نصف نهائي 2 + النهائي الكبير' : '2 Semi-Finals + 1 Grand Championship Final'}
                  </div>
                </button>
              </div>
            </div>

            {/* Player Cards Inputs */}
            <div className="space-y-2.5">
              {/* Player 1 */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                <div className="relative">
                  <select
                    value={p1Avatar}
                    onChange={(e) => setP1Avatar(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 text-xl text-center cursor-pointer appearance-none flex items-center justify-center"
                  >
                    {DEFAULT_AVATARS.map(av => <option key={av} value={av}>{av}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 block mb-0.5">
                    {isAr ? 'اللاعب 1 (المضيف / أنت):' : 'Player 1 (Host / You):'}
                  </label>
                  <input
                    type="text"
                    value={p1Name}
                    onChange={(e) => setP1Name(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold outline-none focus:border-amber-400"
                    placeholder="Player 1"
                  />
                </div>
              </div>

              {/* Player 2 */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                <div className="relative">
                  <select
                    value={p2Avatar}
                    onChange={(e) => setP2Avatar(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 text-xl text-center cursor-pointer appearance-none flex items-center justify-center"
                  >
                    {DEFAULT_AVATARS.map(av => <option key={av} value={av}>{av}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 block mb-0.5">
                    {isAr ? 'اللاعب 2 (الصديق الأول):' : 'Player 2 (Friend 1):'}
                  </label>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={(e) => setP2Name(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold outline-none focus:border-amber-400"
                    placeholder="Player 2"
                  />
                </div>
              </div>

              {/* Player 3 & 4 (if 4 players) */}
              {playerCount === 4 && (
                <>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                    <div className="relative">
                      <select
                        value={p3Avatar}
                        onChange={(e) => setP3Avatar(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 text-xl text-center cursor-pointer appearance-none flex items-center justify-center"
                      >
                        {DEFAULT_AVATARS.map(av => <option key={av} value={av}>{av}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-black text-slate-400 block mb-0.5">
                        {isAr ? 'اللاعب 3 (الصديق الثاني):' : 'Player 3 (Friend 2):'}
                      </label>
                      <input
                        type="text"
                        value={p3Name}
                        onChange={(e) => setP3Name(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold outline-none focus:border-amber-400"
                        placeholder="Player 3"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                    <div className="relative">
                      <select
                        value={p4Avatar}
                        onChange={(e) => setP4Avatar(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 text-xl text-center cursor-pointer appearance-none flex items-center justify-center"
                      >
                        {DEFAULT_AVATARS.map(av => <option key={av} value={av}>{av}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-black text-slate-400 block mb-0.5">
                        {isAr ? 'اللاعب 4 (الصديق الثالث):' : 'Player 4 (Friend 3):'}
                      </label>
                      <input
                        type="text"
                        value={p4Name}
                        onChange={(e) => setP4Name(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold outline-none focus:border-amber-400"
                        placeholder="Player 4"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerateTournament(playerCount)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Trophy size={16} fill="currentColor" />
              <span>{isAr ? `توليد جدول بطولة الـ ${playerCount} لاعبين وتأكيد الأسماء` : `Generate ${playerCount}-Player Tournament Bracket`}</span>
            </button>
          </div>
        )}

        {/* Tab 3: Hotspot Room & Wi-Fi Sharing */}
        {modeTab === 'network' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-center">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 flex items-center justify-center mx-auto mb-2 text-2xl">
                <Wifi size={24} />
              </div>
              <h3 className="text-sm font-black text-white mb-1">
                {isAr ? 'إنشاء غرفة بطولة عبر نقطة اتصال الهوتسبوت' : 'Create Hotspot Tournament Room'}
              </h3>
              <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                {isAr
                  ? 'قم بتشغيل نقطة اتصال الهوتسبوت (Hotspot) على هاتفك واجعل أصدقائك يتصلون بالشبكة للمشاركة في البطولة معاً!'
                  : 'Turn on portable Hotspot on your phone and let friends join your local tournament!'}
              </p>

              {!hostRoomCode ? (
                <button
                  onClick={handleCreateNetworkRoom}
                  disabled={isCreatingRoom}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-black text-xs shadow-lg transition active:scale-95 cursor-pointer"
                >
                  {isCreatingRoom 
                    ? (isAr ? 'جاري إنشاء الغرفة...' : 'Generating Room...') 
                    : (isAr ? 'إنشاء رمز غرفة البطولة الآن' : 'Create Hotspot Tournament Code')}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-500/50 inline-block font-mono font-black text-2xl tracking-widest text-cyan-300">
                    {hostRoomCode}
                  </div>
                  <div>
                    <button
                      onClick={() => copyCode(hostRoomCode)}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedCode ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ رمز الغرفة' : 'Copy Room Code')}</span>
                    </button>
                  </div>
                  {hostQrUrl && (
                    <div className="flex justify-center p-2 bg-white rounded-2xl max-w-[150px] mx-auto shadow-md">
                      <img src={hostQrUrl} alt="Hotspot Tournament QR" className="w-full h-auto rounded-lg" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
              <Users size={16} className="text-amber-400" />
              <span>{isAr ? 'يمكنكم أيضاً تمرير نفس الهاتف للمباريات بشكل سلس وممتع!' : 'You can also pass the phone around for matches seamlessly!'}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-bold">
            {isAr ? `${tournamentState.playerCount} لاعبين في البطولة` : `${tournamentState.playerCount} Players Championship`}
          </div>

          <div className="flex items-center gap-2">
            {activeMatch && modeTab === 'bracket' && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onStartMatch(activeMatch.player1, activeMatch.player2, isAr ? activeMatch.titleAr : activeMatch.titleEn);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Play size={14} fill="currentColor" />
                <span>{isAr ? 'بدء المباراة الجاهزة' : 'Start Next Match'}</span>
              </button>
            )}

            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
