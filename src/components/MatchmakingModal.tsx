/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Swords, 
  Shuffle, 
  X, 
  Play, 
  Star, 
  Banknote, 
  Check, 
  Lock 
} from 'lucide-react';
import { PlayerProfile } from '../game/types';
import { CARTOON_CHARACTERS, CartoonCharacter } from '../game/characters';
import { CartoonAvatar } from './CartoonAvatar';
import { sounds } from '../game/audio';
import { i18n } from '../game/i18n';

export interface StakeOption {
  id: string;
  amount: number;
  label: string;
  nameAr: string;
  badge: string;
  iconBg: string;
  borderColor: string;
}

export const STAKE_OPTIONS: StakeOption[] = [
  {
    id: '50',
    amount: 50,
    label: '50',
    nameAr: '50 كوينز',
    badge: '50',
    iconBg: 'from-amber-600 to-yellow-600',
    borderColor: 'border-yellow-500',
  },
  {
    id: '250',
    amount: 250,
    label: '250',
    nameAr: '250 كوينز',
    badge: '250',
    iconBg: 'from-emerald-700 to-green-600',
    borderColor: 'border-emerald-500',
  },
  {
    id: '1500',
    amount: 1500,
    label: '1,500',
    nameAr: '1,500 كوينز',
    badge: '1500',
    iconBg: 'from-teal-700 to-emerald-600',
    borderColor: 'border-teal-500',
  },
  {
    id: '2500',
    amount: 2500,
    label: '2,500',
    nameAr: '2,500 كوينز',
    badge: '2500',
    iconBg: 'from-blue-700 to-cyan-600',
    borderColor: 'border-cyan-500',
  },
  {
    id: '10k',
    amount: 10000,
    label: '10k',
    nameAr: '10,000 كوينز (10k)',
    badge: '10k',
    iconBg: 'from-indigo-700 to-blue-600',
    borderColor: 'border-blue-400',
  },
  {
    id: '25k',
    amount: 25000,
    label: '25k',
    nameAr: '25,000 كوينز (25k)',
    badge: '25k',
    iconBg: 'from-purple-700 to-indigo-600',
    borderColor: 'border-purple-400',
  },
  {
    id: '50k',
    amount: 50000,
    label: '50k',
    nameAr: '50,000 كوينز (50k)',
    badge: '50k',
    iconBg: 'from-fuchsia-700 to-pink-600',
    borderColor: 'border-pink-400',
  },
  {
    id: '100k',
    amount: 100000,
    label: '100k',
    nameAr: '100,000 كوينز (100k)',
    badge: '100k',
    iconBg: 'from-amber-700 to-yellow-600',
    borderColor: 'border-amber-400',
  },
  {
    id: '250k',
    amount: 250000,
    label: '250k',
    nameAr: '250,000 كوينز (250k)',
    badge: '250k',
    iconBg: 'from-orange-700 to-amber-600',
    borderColor: 'border-orange-400',
  },
  {
    id: '500k',
    amount: 500000,
    label: '500k',
    nameAr: '500,000 كوينز (500k)',
    badge: '500k',
    iconBg: 'from-rose-700 to-red-600',
    borderColor: 'border-red-400',
  },
  {
    id: '1m',
    amount: 1000000,
    label: '1M',
    nameAr: '1,000,000 كوينز (1M)',
    badge: '1M',
    iconBg: 'from-emerald-600 via-teal-500 to-amber-500',
    borderColor: 'border-emerald-400',
  },
];

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: PlayerProfile;
  onConfirmOpponent: (opponent: CartoonCharacter, stakeLabel: string, stakeAmount: number) => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onConfirmOpponent,
}) => {
  // 1. Stage: 'stake' (choose how much money to play for) -> 'spinning' (random character selection)
  const [stage, setStage] = useState<'stake' | 'spinning'>('stake');
  const [selectedStake, setSelectedStake] = useState<StakeOption>(STAKE_OPTIONS[0]);
  const isAr = i18n.getLanguage() === 'ar';

  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<CartoonCharacter | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger random selection cycle through cartoon character slots
  const startRandomSelection = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);

    setIsSpinning(true);
    setSelectedOpponent(null);
    setCountdown(null);

    // Pick random final target index
    const targetIndex = Math.floor(Math.random() * CARTOON_CHARACTERS.length);
    const totalSteps = CARTOON_CHARACTERS.length * 2 + targetIndex;
    let currentStep = 0;
    let delay = 65;

    const tick = () => {
      currentStep++;
      const nextIndex = currentStep % CARTOON_CHARACTERS.length;
      setHighlightedIndex(nextIndex);
      sounds.playClick();

      if (currentStep >= totalSteps) {
        // Selection complete!
        setIsSpinning(false);
        const chosen = CARTOON_CHARACTERS[nextIndex];
        setSelectedOpponent(chosen);
        sounds.playPocketDrop();

        // 2-second countdown before auto-start
        let sec = 2;
        setCountdown(sec);
        countdownTimerRef.current = setInterval(() => {
          sec--;
          setCountdown(sec);
          if (sec <= 0) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            onConfirmOpponent(chosen, selectedStake.label, selectedStake.amount);
          }
        }, 1000);
      } else {
        // Decelerate smoothly as it approaches the chosen cartoon character
        if (currentStep > totalSteps - 7) {
          delay += 35;
        } else if (currentStep > totalSteps - 12) {
          delay += 16;
        }
        spinTimerRef.current = setTimeout(tick, delay);
      }
    };

    spinTimerRef.current = setTimeout(tick, delay);
  };

  // Reset to stake selection stage and auto-select highest affordable stake
  useEffect(() => {
    if (isOpen) {
      setStage('stake');
      setIsSpinning(false);
      setSelectedOpponent(null);
      setCountdown(null);

      // Select highest affordable stake by default
      const affordable = STAKE_OPTIONS.filter(o => userProfile.coins >= o.amount);
      if (affordable.length > 0) {
        setSelectedStake(affordable[affordable.length - 1]);
      } else {
        setSelectedStake(STAKE_OPTIONS[0]);
      }
    }
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isOpen, userProfile.coins]);

  const handleProceedToSpin = () => {
    // Strictly prevent playing with money exceeding the player's balance!
    if (userProfile.coins < selectedStake.amount) {
      sounds.playFoul();
      return;
    }
    sounds.playClick();
    setStage('spinning');
    startRandomSelection();
  };

  if (!isOpen) return null;

  const currentDisplayOpponent = selectedOpponent || CARTOON_CHARACTERS[highlightedIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-920 to-slate-950 border-2 border-emerald-500/50 shadow-[0_0_60px_rgba(16,185,129,0.3)] p-4 sm:p-6 overflow-hidden flex flex-col gap-3.5 max-h-[95vh] overflow-y-auto">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              {stage === 'stake' ? <Banknote size={22} className="animate-pulse" /> : <Swords size={22} className="animate-pulse" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>
                  {stage === 'stake' 
                    ? i18n.t('chooseStakeTitle') 
                    : isSpinning 
                    ? 'جاري اختيار الخصم الكرتوني عشوائياً...' 
                    : 'تم العثور على الخصم الكرتوني! ⚡'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {stage === 'stake' 
                  ? 'حدد بكم ستلعب من المال (الخيارات المتاحة حسب رصيدك)' 
                  : isSpinning 
                  ? 'تدوير الروليت بين أبطال البلياردو الكرتونيين' 
                  : 'استعد للمواجهة الفورية'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* =========================================================================
            STAGE 1: CHOOSE STAKE BEFORE RANDOM SELECTION (250, 1500, 2500, 10k, 25k, 50k, 100k, 250k, 500k, 1M)
            STRICT VALIDATION: Player CANNOT play for more cash than they have!
           ========================================================================= */}
        {stage === 'stake' && (
          <div className="relative z-10 flex flex-col gap-3 py-1 animate-fade-in">
            {/* Live Balance Bar & Rule Notice */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-slate-950 flex items-center justify-center font-black shadow">
                  <Banknote size={20} />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <span>{isAr ? 'رصيدك الحالي:' : 'Your Balance:'}</span>
                    <span className="text-emerald-400 font-mono text-sm sm:text-base font-black">
                      {userProfile.coins.toLocaleString()}
                    </span>
                    <span className="text-emerald-300 text-xs font-bold">{isAr ? 'كوينز' : 'Coins'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {isAr ? 'اختر مبلغ الرهان الذي ترغب في المنافسة عليه' : 'Select the wager amount you want to play for'}
                  </div>
                </div>
              </div>

              {/* Selected Stake Badge */}
              <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono font-black text-xs sm:text-sm shrink-0 flex items-center gap-1.5">
                <Banknote size={14} />
                <span>{selectedStake.label}</span>
              </div>
            </div>

            {/* Clear Wager Explanation Banner */}
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-bold">
              {isAr
                ? '⚡ نظام الرهان: لا يُخصم أي قرش عند بدء المباراة! عند الفوز تربح ضعف المبلغ مرة واحدة. وعند الخسارة فقط يُخصم مبلغ الرهان.'
                : '⚡ Bet Rule: 0 deducted at match start! On victory win double your stake. On defeat only your stake is deducted.'}
            </div>

            {/* The 10 Stake Cards: 250, 1500, 2500, 10k, 25k, 50k, 100k, 250k, 500k, 1M */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-[48vh] overflow-y-auto pr-1">
              {STAKE_OPTIONS.map((opt) => {
                const isSelected = selectedStake.id === opt.id;
                const canAfford = userProfile.coins >= opt.amount;

                return (
                  <button
                    key={opt.id}
                    disabled={!canAfford}
                    onClick={() => {
                      if (!canAfford) {
                        sounds.playFoul();
                        return;
                      }
                      sounds.playClick();
                      setSelectedStake(opt);
                    }}
                    className={`relative p-3 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-between text-center ${
                      !canAfford
                        ? 'opacity-40 cursor-not-allowed bg-slate-950/60 border-slate-800/80 grayscale-[40%]'
                        : isSelected
                        ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-102 ring-2 ring-emerald-400/60 cursor-pointer'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 cursor-pointer'
                    }`}
                  >
                    {/* Selected Check Badge */}
                    {isSelected && canAfford && (
                      <div className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                    )}

                    {/* Insufficient funds lock badge */}
                    {!canAfford && (
                      <div className="absolute top-2 right-2 px-1 py-0.5 rounded-full bg-rose-500/25 border border-rose-500/50 text-rose-300 text-[8px] font-black flex items-center gap-0.5 shadow">
                        <Lock size={9} />
                        <span>{isAr ? 'أقل' : 'Locked'}</span>
                      </div>
                    )}

                    {/* Paper Banknote Icon Badge */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.iconBg} flex items-center justify-center shadow text-white mb-1.5 transition-transform ${canAfford ? 'group-hover:scale-105' : ''}`}>
                      <Banknote size={19} className="text-emerald-100" />
                    </div>

                    {/* Amount Label */}
                    <div className="text-sm sm:text-base font-black text-white font-mono tracking-wide">
                      {opt.label}
                    </div>

                    <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                      {opt.nameAr}
                    </div>

                    {/* Prize Pot or Not enough notice */}
                    <div className="w-full mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
                      {canAfford ? (
                        <>
                          <span className="text-slate-400">{isAr ? 'الجائزة:' : 'Pot:'}</span>
                          <span className="font-mono font-bold text-emerald-400">
                            ${(opt.amount * 2).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-rose-400 font-bold text-center w-full">
                          {isAr ? `تحتاج ${opt.label}` : `Needs ${opt.label}`}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirm & Start Random Selection Button */}
            {userProfile.coins < selectedStake.amount ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow text-center">
                <Lock size={16} className="text-rose-400 shrink-0" />
                <span>
                  لا يمكنك اللعب بهذا المبلغ لأن رصيدك ({userProfile.coins.toLocaleString()} عملة) أقل من الرهان المطلوب ({selectedStake.label})!
                </span>
              </div>
            ) : (
              <button
                onClick={handleProceedToSpin}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_6px_25px_rgba(16,185,129,0.4)] border border-emerald-300/50 transition-all duration-200 active:scale-98 cursor-pointer mt-1"
              >
                <Shuffle size={18} />
                <span>متابعة وتدوير لاختيار الخصم عشوائياً (الرهان: {selectedStake.label}) ⚡</span>
              </button>
            )}
          </div>
        )}

        {/* =========================================================================
            STAGE 2: CARTOON OPPONENT ROULETTE WHEEL SELECTION
           ========================================================================= */}
        {stage === 'spinning' && (
          <>
            {/* Stake Indicator & Option to Change */}
            <div className="relative z-10 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Banknote size={15} className="text-emerald-400" />
                <span className="text-slate-400">{isAr ? 'مبلغ الرهان المختار:' : 'Selected Stake:'}</span>
                <span className="font-mono font-black text-emerald-300">{selectedStake.label}</span>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setStage('stake');
                }}
                disabled={isSpinning}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer disabled:opacity-40"
              >
                تغيير المبلغ
              </button>
            </div>

            {/* Cartoon Opponent Slots Grid */}
            <div className="relative z-10">
              <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>خانات أبطال البلياردو الكرتونيين</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-black text-[10px]">
                    {CARTOON_CHARACTERS.length} شخصيات
                  </span>
                </span>
                {isSpinning && (
                  <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px] animate-pulse">
                    <Shuffle size={12} className="animate-spin" /> جاري الاختيار العشوائي...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {CARTOON_CHARACTERS.map((char, idx) => {
                  const isCurrent = idx === highlightedIndex;
                  const isWinner = selectedOpponent?.id === char.id;

                  return (
                    <div
                      key={char.id}
                      className={`relative p-2 rounded-2xl border transition-all duration-150 flex flex-col items-center text-center cursor-pointer ${
                        isWinner
                          ? 'bg-gradient-to-b from-emerald-500/30 to-slate-900 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.55)] scale-105 z-10 ring-2 ring-emerald-400'
                          : isCurrent
                          ? 'bg-amber-500/25 border-amber-400 scale-102 shadow-lg ring-1 ring-amber-400'
                          : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 opacity-75'
                      }`}
                    >
                      {/* Cartoon Character Portrait */}
                      <div className="relative mb-1">
                        <CartoonAvatar
                          characterId={char.id}
                          avatar={char.avatar}
                          size="sm"
                          className="shadow-md"
                        />
                        {isWinner && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-black text-white truncate max-w-[75px]">
                        {char.nameAr}
                      </div>
                      <div className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5">
                        <Star size={8} fill="currentColor" />
                        <span>Lv.{char.level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VS Matchup Card Presentation */}
            <div className="relative z-10 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3">
              {/* User Side (Right) */}
              <div className="flex items-center gap-3 text-right flex-1">
                <CartoonAvatar
                  avatar={userProfile.avatar}
                  size="lg"
                  className="border-2 border-sky-400/80 shadow-lg shrink-0"
                />
                <div className="overflow-hidden">
                  <div className="text-xs sm:text-sm font-black text-white truncate">
                    {userProfile.name}
                  </div>
                  <div className="text-[11px] text-sky-400 font-bold flex items-center gap-1">
                    <span>المستوى {userProfile.level}</span>
                    <span className="text-slate-400">· أنت</span>
                  </div>
                </div>
              </div>

              {/* VS Center Badge */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-white font-black text-xs flex items-center justify-center shadow-lg ring-3 ring-slate-900 animate-bounce">
                  VS
                </div>
              </div>

              {/* Opponent Side (Left) */}
              <div className="flex items-center justify-end gap-3 text-left flex-1">
                <div className="overflow-hidden text-left">
                  <div className="text-xs sm:text-sm font-black text-white truncate">
                    {currentDisplayOpponent.nameAr}
                  </div>
                  <div className="text-[11px] text-amber-400 font-bold">
                    {currentDisplayOpponent.titleAr}
                  </div>
                </div>
                <CartoonAvatar
                  characterId={currentDisplayOpponent.id}
                  avatar={currentDisplayOpponent.avatar}
                  size="lg"
                  className="border-2 border-amber-400/80 shadow-lg shrink-0"
                />
              </div>
            </div>

            {/* Opponent Detailed Specialty Info */}
            <div className="relative z-10 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">🎯 المهارة:</span>
                <span>{currentDisplayOpponent.specialty}</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold shrink-0 flex items-center gap-1">
                <span>نسبة الفوز:</span>
                <span className="font-mono">{currentDisplayOpponent.winRate}%</span>
              </div>
            </div>

            {/* Action Controls */}
            <div className="relative z-10 flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  sounds.playClick();
                  startRandomSelection();
                }}
                disabled={isSpinning}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Shuffle size={14} className={isSpinning ? 'animate-spin' : ''} />
                <span>إعادة الاختيار عشوائياً</span>
              </button>

              <button
                onClick={() => {
                  if (userProfile.coins < selectedStake.amount) {
                    sounds.playFoul();
                    return;
                  }
                  sounds.playClick();
                  onConfirmOpponent(currentDisplayOpponent, selectedStake.label, selectedStake.amount);
                }}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition active:scale-95 cursor-pointer"
              >
                <Play size={16} fill="currentColor" />
                <span>
                  {countdown !== null
                    ? `بدء المواجهة الآن (${countdown}) ⚡`
                    : 'بدء المواجهة فوراً ⚡'}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
