/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  MessageSquare, 
  ThumbsUp, 
  Star, 
  Banknote, 
  Zap, 
  Pause,
  ShoppingBag,
  Volume2,
  VolumeX,
  Music,
  ChevronLeft,
  ChevronRight,
  Box,
  Globe,
  Clock,
  Trophy
} from 'lucide-react';
import { PlayerProfile, PlayerGroup, BallState } from '../game/types';
import { CameraViewMode } from '../game/scene';
import { CartoonAvatar } from './CartoonAvatar';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

const BALL_COLORS: Record<number, { color: string; isStripe: boolean }> = {
  1: { color: '#facc15', isStripe: false },
  2: { color: '#2563eb', isStripe: false },
  3: { color: '#dc2626', isStripe: false },
  4: { color: '#7c3aed', isStripe: false },
  5: { color: '#ea580c', isStripe: false },
  6: { color: '#16a34a', isStripe: false },
  7: { color: '#881337', isStripe: false },
  8: { color: '#09090b', isStripe: false },
  9: { color: '#facc15', isStripe: true },
  10: { color: '#2563eb', isStripe: true },
  11: { color: '#dc2626', isStripe: true },
  12: { color: '#7c3aed', isStripe: true },
  13: { color: '#ea580c', isStripe: true },
  14: { color: '#16a34a', isStripe: true },
  15: { color: '#881337', isStripe: true },
};

interface HUDProps {
  mode: string;
  matchType: string;
  profile: PlayerProfile;
  opponentName: string;
  opponentAvatar: string;
  currentPlayerIndex: number;
  isMyTurn: boolean;
  playerGroups: [PlayerGroup, PlayerGroup];
  balls: BallState[];
  statusMessage: string;
  isBallInHand: boolean;
  power: number;
  onPowerChange: (power: number) => void;
  onShoot: () => void;
  onFineAngleAdjust: (delta: number) => void;
  viewMode: CameraViewMode;
  onViewModeChange: (mode: CameraViewMode) => void;
  onOpenSpinModal: () => void;
  onOpenShop?: () => void;
  onPauseMatch: () => void;
  targetBallId?: number | null;
  showBallMarkers?: boolean;
  stakeDisplay?: string;
  onSendReaction?: (emoji: string) => void;
  incomingReactionEmoji?: string | null;
  coinDeductionNotice?: { amount: number; message: string; timestamp: number } | null;
  turnTimeLeft?: number;
}

export const HUD: React.FC<HUDProps> = ({
  mode,
  matchType,
  profile,
  opponentName,
  opponentAvatar,
  currentPlayerIndex,
  isMyTurn,
  playerGroups,
  balls,
  statusMessage,
  isBallInHand,
  power,
  onPowerChange,
  onShoot,
  onFineAngleAdjust,
  viewMode,
  onViewModeChange,
  onOpenSpinModal,
  onOpenShop,
  onPauseMatch,
  targetBallId,
  stakeDisplay,
  onSendReaction,
  incomingReactionEmoji,
  coinDeductionNotice,
  turnTimeLeft,
}) => {
  const [sfxMuted, setSfxMuted] = useState(!sounds.sfxEnabled);
  const [musicActive, setMusicActive] = useState(sounds.musicEnabled);
  const [showChatMenu, setShowChatMenu] = useState(false);

  // User Reaction state
  const [userReactionEmoji, setUserReactionEmoji] = useState<string | null>(null);
  const [reactionProgress, setReactionProgress] = useState<number>(100);
  const reactionTimerRef = useRef<number | null>(null);
  const reactionIntervalRef = useRef<number | null>(null);

  // Opponent Reaction state
  const [oppReactionEmoji, setOppReactionEmoji] = useState<string | null>(null);
  const [oppReactionProgress, setOppReactionProgress] = useState<number>(100);
  const oppTimerRef = useRef<number | null>(null);
  const oppIntervalRef = useRef<number | null>(null);

  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  // Listen for incoming remote reactions from P2P opponent
  useEffect(() => {
    if (incomingReactionEmoji) {
      triggerOpponentReaction(incomingReactionEmoji);
    }
  }, [incomingReactionEmoji]);

  useEffect(() => {
    return () => {
      if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
      if (reactionIntervalRef.current) window.clearInterval(reactionIntervalRef.current);
      if (oppTimerRef.current) window.clearTimeout(oppTimerRef.current);
      if (oppIntervalRef.current) window.clearInterval(oppIntervalRef.current);
    };
  }, []);

  const isAr = lang === 'ar';
  const p1Group = playerGroups[0];
  const p2Group = playerGroups[1];

  // Pocketed balls list (excluding cue ball) for the right-side ball return chute
  const pottedBalls = balls.filter(b => b.inPocket && b.id !== 0);

  const toggleSfx = () => {
    sounds.sfxEnabled = !sounds.sfxEnabled;
    setSfxMuted(!sounds.sfxEnabled);
    sounds.playClick();
  };

  const toggleMusic = () => {
    const state = sounds.toggleMusic();
    setMusicActive(state);
    sounds.playClick();
  };

  const toggleLang = () => {
    sounds.playClick();
    i18n.toggleLanguage();
  };

  const triggerOpponentReaction = (emoji: string) => {
    if (oppTimerRef.current) window.clearTimeout(oppTimerRef.current);
    if (oppIntervalRef.current) window.clearInterval(oppIntervalRef.current);

    sounds.playClick();
    setOppReactionEmoji(emoji);
    setOppReactionProgress(100);

    const startTime = Date.now();
    const duration = 4000;

    oppIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setOppReactionProgress(pct);
    }, 40);

    oppTimerRef.current = window.setTimeout(() => {
      setOppReactionEmoji(null);
      setOppReactionProgress(0);
      if (oppIntervalRef.current) {
        window.clearInterval(oppIntervalRef.current);
        oppIntervalRef.current = null;
      }
      oppTimerRef.current = null;
    }, duration);
  };

  const sendReaction = (emoji: string) => {
    sounds.playClick();
    if (reactionTimerRef.current) window.clearTimeout(reactionTimerRef.current);
    if (reactionIntervalRef.current) window.clearInterval(reactionIntervalRef.current);

    setUserReactionEmoji(emoji);
    setReactionProgress(100);
    setShowChatMenu(false);

    // Transmit to remote peer if in multiplayer!
    if (onSendReaction) {
      onSendReaction(emoji);
    }

    const startTime = Date.now();
    const duration = 4000;

    reactionIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setReactionProgress(pct);
    }, 40);

    reactionTimerRef.current = window.setTimeout(() => {
      setUserReactionEmoji(null);
      setReactionProgress(0);
      if (reactionIntervalRef.current) {
        window.clearInterval(reactionIntervalRef.current);
        reactionIntervalRef.current = null;
      }
      reactionTimerRef.current = null;
    }, duration);

    // If playing vs AI, friendly bot reply sometimes
    if (matchType === 'ai' && Math.random() > 0.45) {
      setTimeout(() => {
        const pool = ['😎', '👍', '🎱', '🔥', '👏', '🎯'];
        const reply = pool[Math.floor(Math.random() * pool.length)];
        triggerOpponentReaction(reply);
      }, 1200);
    }
  };

  // Touch / pointer power slider handling
  const handlePowerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePowerFromEvent(e);
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}

    const onMove = (moveEvt: PointerEvent) => {
      updatePowerFromCoords(moveEvt.clientY, target.getBoundingClientRect());
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // Auto-shoot on release if pulled down with enough power
      if (power > 0.08) {
        onShoot();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const updatePowerFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePowerFromCoords(e.clientY, e.currentTarget.getBoundingClientRect());
  };

  const updatePowerFromCoords = (clientY: number, rect: DOMRect) => {
    const relativeY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(rect.height, relativeY));
    const newPower = clampedY / rect.height;
    onPowerChange(Math.min(1.0, Math.max(0.0, newPower)));
  };

  // Helper to render the 7 circular ball slots for each player
  const renderBallSlots = (group: PlayerGroup, isUser: boolean) => {
    const ballIds: number[] = group === 'solids' 
      ? [1, 2, 3, 4, 5, 6, 7] 
      : group === 'stripes' 
      ? [9, 10, 11, 12, 13, 14, 15] 
      : [0, 0, 0, 0, 0, 0, 0];

    const isGroupCleared = group !== 'unassigned' && ballIds.every(id => balls.find(b => b.id === id)?.inPocket);

    return (
      <div className={`flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 ${isUser ? 'justify-start' : 'justify-end'}`}>
        {ballIds.map((id, idx) => {
          if (id === 0) {
            return (
              <div
                key={`empty_${idx}`}
                className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-inner"
              />
            );
          }
          const ball = balls.find(b => b.id === id);
          const inPocket = ball?.inPocket ?? false;
          const info = BALL_COLORS[id];
          const isTargeted = targetBallId === id;

          return (
            <div
              key={id}
              className={`relative flex items-center justify-center rounded-full text-[6px] sm:text-[8px] font-black transition-all ${
                inPocket
                  ? 'w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 bg-slate-900/90 border border-slate-700 text-slate-500 opacity-25'
                  : isTargeted
                  ? 'w-3.5 sm:w-4.5 h-3.5 sm:h-4.5 ring-1 sm:ring-2 ring-emerald-400 scale-110 shadow-lg'
                  : 'w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 shadow-sm'
              }`}
              style={{
                backgroundColor: inPocket ? undefined : (info.isStripe ? '#ffffff' : info.color),
                color: inPocket ? '#64748b' : (info.isStripe ? '#09090b' : (id === 1 ? '#09090b' : '#ffffff')),
                border: info.isStripe && !inPocket ? `1.5px solid ${info.color}` : undefined,
              }}
              title={`Ball ${id} (${inPocket ? 'Pocketed' : 'Active'})`}
            >
              {inPocket ? '✓' : id}
            </div>
          );
        })}
        {isGroupCleared && (
          <div
            className="flex items-center justify-center w-3.5 sm:w-4.5 h-3.5 sm:h-4.5 rounded-full bg-slate-950 text-amber-300 border border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse text-[8px] sm:text-[9px] font-black ms-0.5"
            title="Target: 8-Ball"
          >
            8
          </div>
        )}
      </div>
    );
  };

  const isPlayer1Active = currentPlayerIndex === 0;
  const isPlayer2Active = currentPlayerIndex === 1;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-1.5 sm:p-3 z-20" dir={isAr ? 'rtl' : 'ltr'}>
      {/* =========================================================================
          1. TOP BAR: SCOREBOARD & HEADER
         ========================================================================= */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left Section: Menu, Chat, Player 1 Info */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Menu Button */}
          <button
            onClick={() => { sounds.playClick(); onPauseMatch(); }}
            className="pointer-events-auto p-1.5 sm:p-2.5 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 text-white shadow-lg border border-emerald-400/50 transition active:scale-95 cursor-pointer"
            title={i18n.t('menu')}
          >
            <Menu size={18} className="stroke-[2.5]" />
          </button>

          {/* Chat / Reactions Button */}
          <div className="relative pointer-events-auto">
            <button
              onClick={() => { sounds.playClick(); setShowChatMenu(!showChatMenu); }}
              className="p-1.5 sm:p-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 shadow-lg border border-amber-300 transition active:scale-95 cursor-pointer"
              title={i18n.t('chatReactions')}
            >
              <MessageSquare size={16} fill="currentColor" />
            </button>

            {/* Quick Reactions Tray */}
            {showChatMenu && (
              <div className="absolute top-12 left-0 rtl:left-auto rtl:right-0 z-50 p-2.5 rounded-2xl bg-slate-900 border-2 border-amber-400/80 shadow-2xl flex items-center gap-2 animate-fade-in flex-wrap max-w-[280px]">
                {['🤪', '😎', '🔥', '👍', '🎯', '🎱', '👏', '🏆', '😱', '💥'].map((emo) => (
                  <button
                    key={emo}
                    onClick={() => sendReaction(emo)}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-2xl transition hover:scale-130 active:scale-95 cursor-pointer"
                  >
                    {emo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Player 1 Profile Card */}
          <div className="pointer-events-auto relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-lg">
            {/* Player 1 Avatar with Turn Glow & Prominent Floating Reaction Bubble */}
            <div className="relative shrink-0">
              <div
                className={`rounded-xl border-2 overflow-hidden flex items-center justify-center shadow transition-all duration-300 ${
                  isPlayer1Active
                    ? 'border-emerald-400 ring-2 ring-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.7)] animate-pulse'
                    : 'border-slate-700 opacity-90'
                }`}
              >
                <CartoonAvatar avatar={profile.avatar} size="sm" showBorder={false} />
              </div>

              {/* VISIBLE Floating Animated Reaction Bubble for Player 1 (Positioned below card so NOT clipped!) */}
              {userReactionEmoji && (
                <div className="absolute top-10 sm:top-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none animate-bounce">
                  <div className="relative px-2.5 py-1 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-black shadow-[0_8px_20px_rgba(0,0,0,0.6)] border-2 border-white flex items-center justify-center text-2xl shrink-0 scale-110">
                    <span>{userReactionEmoji}</span>
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-300 rotate-45 border-l-2 border-t-2 border-white" />
                  </div>
                  <div className="w-9 h-1.5 rounded-full bg-slate-950/95 overflow-hidden mt-1 border border-white/50 shadow">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-75 ease-linear" style={{ width: `${reactionProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Player 1 Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-0.5 px-1 sm:px-1.5 py-0.2 rounded bg-sky-900/80 border border-sky-400/50 text-[9px] sm:text-[10px] font-black text-sky-300 shrink-0">
                  <Star size={9} fill="currentColor" className="text-amber-400" />
                  {profile.level || 1}
                </span>
                <span className="text-xs sm:text-sm font-black text-white tracking-wide truncate max-w-[80px] sm:max-w-[130px]">
                  {profile.name}
                </span>
                {isPlayer1Active && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              {renderBallSlots(p1Group, true)}
            </div>
          </div>
        </div>

        {/* Center: Match Stake & 2D / 3D View Toggle (2D is DEFAULT as requested!) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Match Stake Badge */}
          <div className="relative px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-2xl bg-gradient-to-b from-emerald-950 to-slate-950 border border-emerald-500/50 shadow-lg flex items-center gap-1.5">
            {stakeDisplay && (stakeDisplay.includes('كأس') || stakeDisplay.toLowerCase().includes('cup')) ? (
              <>
                <Trophy size={16} className="text-amber-400" />
                <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-wider">
                  {stakeDisplay}
                </span>
              </>
            ) : (
              <>
                <Banknote size={16} className="text-emerald-400" />
                <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono tracking-wider">
                  {stakeDisplay ? stakeDisplay.replace(/^\$/, '') : '0'} {lang === 'ar' ? 'كوينز' : 'Coins'}
                </span>
              </>
            )}

            {/* Negative Deduction Alert badge right above/below stake in HUD */}
            {coinDeductionNotice && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-red-600 border border-red-300 text-white font-mono font-black text-[9px] sm:text-[10px] shadow-lg animate-pulse flex items-center gap-1">
                <span>🔻</span>
                <span>-{coinDeductionNotice.amount.toLocaleString()}</span>
                <span>{lang === 'ar' ? 'تم الخصم' : 'Deducted'}</span>
              </div>
            )}
          </div>

          {/* 3D / 2D View Switcher (Default is 2D top-down view!) */}
          <button
            onClick={() => {
              sounds.playClick();
              const nextMode: CameraViewMode = viewMode === 'top' ? 'aim' : 'top';
              onViewModeChange(nextMode);
            }}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-2xl border text-[11px] sm:text-xs font-black flex items-center gap-1.5 shadow-lg transition active:scale-95 cursor-pointer ${
              viewMode === 'aim'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle 2D / 3D Camera View"
          >
            <Box size={14} className={viewMode === 'aim' ? 'text-cyan-200' : 'text-slate-400'} />
            <span className="hidden sm:inline">{viewMode === 'aim' ? i18n.t('view3D') : i18n.t('view2D')}</span>
            <span className="sm:hidden">{viewMode === 'aim' ? '3D' : '2D'}</span>
          </button>
        </div>

        {/* Right Section: Player 2 (Opponent), Spin, Cue Shop */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Player 2 Profile Card */}
          <div className="pointer-events-auto relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-lg">
            {/* Player 2 Details */}
            <div className="min-w-0 text-right rtl:text-left">
              <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                {isPlayer2Active && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
                <button
                  onClick={() => { sounds.playClick(); triggerOpponentReaction('👍'); }}
                  className="p-0.5 rounded bg-slate-800 text-amber-400 hover:text-amber-300 text-[10px] cursor-pointer"
                  title="Cheer Opponent"
                >
                  <ThumbsUp size={11} />
                </button>
                <span className="text-xs sm:text-sm font-black text-white tracking-wide truncate max-w-[80px] sm:max-w-[130px]">
                  {opponentName}
                </span>
                <span className="flex items-center gap-0.5 px-1 sm:px-1.5 py-0.2 rounded bg-purple-900/80 border border-purple-400/50 text-[9px] sm:text-[10px] font-black text-purple-300 shrink-0">
                  <Star size={9} fill="currentColor" className="text-amber-400" />
                  292
                </span>
              </div>
              {renderBallSlots(p2Group, false)}
            </div>

            {/* Player 2 Avatar with Turn Glow & VISIBLE Floating Reaction Bubble */}
            <div className="relative shrink-0">
              <div
                className={`rounded-xl border-2 overflow-hidden flex items-center justify-center shadow transition-all duration-300 ${
                  isPlayer2Active
                    ? 'border-emerald-400 ring-2 ring-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.7)] animate-pulse'
                    : 'border-slate-700 opacity-90'
                }`}
              >
                <CartoonAvatar avatar={opponentAvatar} size="sm" showBorder={false} />
              </div>

              {/* VISIBLE Floating Animated Reaction Bubble for Opponent (Positioned below card so NOT clipped!) */}
              {oppReactionEmoji && (
                <div className="absolute top-10 sm:top-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none animate-bounce">
                  <div className="relative px-2.5 py-1 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white font-black shadow-[0_8px_20px_rgba(0,0,0,0.6)] border-2 border-white flex items-center justify-center text-2xl shrink-0 scale-110">
                    <span>{oppReactionEmoji}</span>
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rotate-45 border-l-2 border-t-2 border-white" />
                  </div>
                  <div className="w-9 h-1.5 rounded-full bg-slate-950/95 overflow-hidden mt-1 border border-white/50 shadow">
                    <div className="h-full bg-pink-400 rounded-full transition-all duration-75 ease-linear" style={{ width: `${oppReactionProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cue Ball Spin Selector Trigger */}
          <button
            onClick={() => { sounds.playClick(); onOpenSpinModal(); }}
            className="pointer-events-auto w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 border-2 border-slate-600 shadow-lg flex items-center justify-center transition active:scale-95 hover:border-amber-400 cursor-pointer"
            title={i18n.t('spinSelector')}
          >
            <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center shadow-inner">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-red-600 shadow" />
            </div>
          </button>

          {/* Cue Stick Shop Trigger */}
          {onOpenShop && (
            <button
              onClick={() => { sounds.playClick(); onOpenShop(); }}
              className="pointer-events-auto w-8 sm:w-10 h-8 sm:h-10 rounded-2xl bg-gradient-to-b from-sky-500 to-blue-600 hover:from-sky-400 text-white shadow-lg border border-sky-300/60 flex items-center justify-center transition active:scale-95 cursor-pointer"
              title={i18n.t('cuesStore')}
            >
              <div className="flex -space-x-1.5 rotate-45">
                <span className="w-1.5 h-4.5 rounded-full bg-amber-400 border border-slate-900" />
                <span className="w-1.5 h-4.5 rounded-full bg-red-500 border border-slate-900" />
                <span className="w-1.5 h-4.5 rounded-full bg-emerald-400 border border-slate-900" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. THE RIGHT-SIDE BALL RETURN TUBE / CHUTE
         ========================================================================= */}
      <div className="pointer-events-auto absolute right-1.5 sm:right-3 top-20 sm:top-24 bottom-16 sm:bottom-20 z-20 flex flex-col items-center">
        <div className="w-6 sm:w-7 h-3 rounded-t-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border border-slate-500 shadow-md" />
        <div className="relative flex-1 w-6 sm:w-7 rounded-b-2xl bg-slate-950/80 border-2 border-slate-500/70 shadow-[0_4px_25px_rgba(0,0,0,0.8)] backdrop-blur-sm p-1 flex flex-col justify-end items-center gap-1 overflow-hidden">
          <div className="absolute top-0 bottom-0 left-1 w-1 bg-white/20 rounded-full pointer-events-none" />
          {pottedBalls.map((pb) => {
            const info = BALL_COLORS[pb.id];
            if (!info) return null;
            return (
              <div
                key={`chute_ball_${pb.id}`}
                className="relative w-4.5 sm:w-5 h-4.5 sm:h-5 rounded-full shadow-md flex items-center justify-center text-[8px] font-black shrink-0 transition-transform animate-bounce"
                style={{
                  backgroundColor: info.isStripe ? '#ffffff' : info.color,
                  color: info.isStripe ? '#09090b' : (pb.id === 1 ? '#09090b' : '#ffffff'),
                  border: info.isStripe ? `2px solid ${info.color}` : '1px solid rgba(0,0,0,0.3)',
                }}
                title={`Ball ${pb.id}`}
              >
                {pb.id}
              </div>
            );
          })}
          {pottedBalls.length === 0 && (
            <span className="text-[7px] text-slate-500 font-bold uppercase rotate-90 my-auto pointer-events-none tracking-widest">
              RACK
            </span>
          )}
        </div>
      </div>

      {/* =========================================================================
          3. TURN STATUS & BALL-IN-HAND NOTIFICATION
         ========================================================================= */}
      {/* Turn Banner & 60-Second Shot Clock at center top */}
      <div className="pointer-events-none absolute top-15 sm:top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          {/* Active Turn Indicator */}
          <div className={`px-3 py-1 rounded-full text-xs font-black shadow-lg border flex items-center gap-1.5 transition-all duration-300 ${
            isMyTurn 
              ? 'bg-emerald-600/90 text-white border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
              : 'bg-slate-900/90 text-amber-300 border-amber-500/40'
          }`}>
            {isMyTurn ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>{isAr ? 'دورك الآن للعب!' : 'YOUR TURN TO SHOOT!'}</span>
              </>
            ) : (
              <>
                <Clock size={12} className="text-amber-400" />
                <span>{isAr ? `دور: ${opponentName}` : `Opponent: ${opponentName}`}</span>
              </>
            )}
          </div>

          {/* 60-Second Shot Clock */}
          {turnTimeLeft !== undefined && (
            <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-black shadow-lg border flex items-center gap-1.5 transition-all duration-300 ${
              turnTimeLeft <= 10
                ? 'bg-red-600 text-white border-red-300 animate-pulse ring-2 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                : turnTimeLeft <= 20
                ? 'bg-amber-600/90 text-white border-amber-300'
                : 'bg-slate-900/90 text-sky-300 border-sky-400/50'
            }`}>
              <Clock size={12} className={turnTimeLeft <= 10 ? 'animate-spin' : ''} />
              <span>{Math.floor(turnTimeLeft / 60)}:{String(turnTimeLeft % 60).padStart(2, '0')}</span>
              <div className="w-8 sm:w-12 h-1.5 bg-slate-950/70 rounded-full overflow-hidden ms-0.5">
                <div 
                  className={`h-full transition-all duration-200 rounded-full ${
                    turnTimeLeft <= 10 ? 'bg-red-200' : turnTimeLeft <= 20 ? 'bg-amber-200' : 'bg-sky-400'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, (turnTimeLeft / 60) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ball in Hand Prominent Notification */}
      {isBallInHand && isMyTurn && (
        <div className="pointer-events-none absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-amber-950/95 border-2 border-amber-400 text-amber-200 text-xs sm:text-sm font-black shadow-2xl animate-bounce text-center flex items-center gap-2">
          <span className="text-base">🖐️</span>
          <span>{isAr ? 'الكرة البيضاء في يدك! المس أو اسحب لتثبيتها في أي مكان تريده على الطاولة' : 'Ball in Hand! Tap or drag cue ball anywhere on table to place it'}</span>
        </div>
      )}

      {/* =========================================================================
          4. LEFT-SIDE CUE POWER PULL-BACK SLIDER & STRIKE BUTTON
         ========================================================================= */}
      {isMyTurn ? (
        <div className="pointer-events-auto absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-20">
          <div className="text-[10px] font-mono font-black text-amber-400 tracking-wider">
            {(power * 100).toFixed(0)}%
          </div>

          {/* Pull-back Track */}
          <div
            onPointerDown={handlePowerPointerDown}
            className="relative w-8 sm:w-10 h-44 sm:h-52 rounded-full bg-slate-950/95 border-2 border-slate-700 shadow-2xl p-1 cursor-ns-resize touch-none flex flex-col justify-between items-center group"
          >
            {/* Power Gradient Fill */}
            <div
              className="absolute top-1 left-1 right-1 rounded-full bg-gradient-to-b from-amber-500 via-orange-500 to-red-500 opacity-90 transition-all duration-75"
              style={{ height: `${power * 96}%` }}
            />

            {/* Cue Stick Handle Knob */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-slate-800 border-2 border-amber-400 shadow-lg flex items-center justify-center text-white text-xs font-black transition-transform"
              style={{ top: `${Math.max(4, power * 80)}%` }}
            >
              <Zap size={12} className="text-amber-300" />
            </div>

            <span className="absolute bottom-2 text-[8px] font-black text-slate-500 pointer-events-none uppercase tracking-tighter">
              {i18n.t('pullCue')}
            </span>
          </div>

          {/* Strike Button - Highly Reliable, Always Fires */}
          <button
            onClick={() => {
              if (power > 0.05) {
                onShoot();
              } else {
                onPowerChange(0.65);
                setTimeout(onShoot, 100);
              }
            }}
            className="w-12 sm:w-14 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 text-white text-[11px] font-black uppercase tracking-wider shadow-[0_4px_15px_rgba(16,185,129,0.5)] border border-emerald-300 transition active:scale-95 cursor-pointer"
          >
            {i18n.t('strike')}
          </button>
        </div>
      ) : (
        /* Opponent Turn Indicator Badge (Replaces missing shoot button with clear feedback!) */
        <div className="pointer-events-none absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20">
          <div className="p-2 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-400 text-center shadow-lg">
            <Clock size={16} className="mx-auto text-amber-400 mb-1" />
            <span className="text-[9px] font-bold block max-w-[50px] leading-tight">
              {isAr ? 'انتظر دورك...' : 'Waiting...'}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. BOTTOM CONTROLS & LANGUAGE TOGGLE
         ========================================================================= */}
      <div className="w-full flex flex-col items-center z-20">
        <div className="flex items-center gap-2">
          {/* Fine Aiming Buttons (Only visible when it is your turn) */}
          {isMyTurn && (
            <div className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg">
              <button
                onClick={() => { sounds.playClick(); onFineAngleAdjust(-0.015); }}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                title="Aim Left"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] font-bold text-slate-400 px-1">{i18n.t('fineAim')}</span>
              <button
                onClick={() => { sounds.playClick(); onFineAngleAdjust(0.015); }}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                title="Aim Right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="pointer-events-auto px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-[10px] font-black text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            title="Switch Language"
          >
            <Globe size={13} />
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {/* Quick Sound & Music Toggles */}
          <div className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg">
            <button
              onClick={toggleSfx}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                sfxMuted ? 'text-red-400' : 'text-slate-300 hover:text-white'
              }`}
              title="Sound Effects"
            >
              {sfxMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              onClick={toggleMusic}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                musicActive ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Music"
            >
              <Music size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
