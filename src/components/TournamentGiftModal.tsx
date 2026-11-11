/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Gift, 
  Banknote, 
  Sparkles, 
  X, 
  Check, 
  ArrowRight, 
  Play, 
  Award,
  Star,
  Zap
} from 'lucide-react';
import { storage, TournamentGiftData } from '../game/storage';
import { PlayerProfile, CueItem } from '../game/types';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface TournamentGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onProfileUpdate: (updated: PlayerProfile) => void;
  onOpenTournament: () => void;
}

export const TournamentGiftModal: React.FC<TournamentGiftModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
  onOpenTournament,
}) => {
  const [giftData, setGiftData] = useState<TournamentGiftData | null>(null);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [awardedReward, setAwardedReward] = useState<{ type: 'cue' | 'coins'; cue?: CueItem; coins?: number } | null>(null);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  useEffect(() => {
    if (isOpen) {
      const pending = storage.getPendingTournamentGift();
      setGiftData(pending);
      setIsOpening(false);
      setIsRevealed(false);
      setAwardedReward(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const handleOpenGift = () => {
    if (isOpening || isRevealed) return;
    setIsOpening(true);
    sounds.playBallHit(0.9);

    setTimeout(() => {
      sounds.playVictory();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch {}

      const result = storage.claimTournamentGift();
      if (result.success && result.gift) {
        if (result.gift.type === 'cue' && result.gift.cueId) {
          const cues = storage.getCues();
          const cue = cues.find(c => c.id === result.gift!.cueId);
          setAwardedReward({ type: 'cue', cue });
        } else if (result.gift.type === 'coins' && result.gift.coinsAmount) {
          setAwardedReward({ type: 'coins', coins: result.gift.coinsAmount });
        }
      }

      onProfileUpdate(storage.getProfile());
      setIsOpening(false);
      setIsRevealed(true);
      setGiftData(null);
    }, 1200);
  };

  const handleClaimDailyBonus = () => {
    sounds.playVictory();
    storage.addCoins(250);
    onProfileUpdate(storage.getProfile());
    setDailyBonusClaimed(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-center overflow-hidden">
        {/* Background ambient gold burst */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-b from-amber-500/25 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-900/40 border-2 border-amber-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.4)] text-4xl">
            {isRevealed ? '🎉' : giftData && !giftData.claimed ? '🎁' : '🏆'}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1">
          {isAr ? 'هدية بطولة الكؤوس الكبرى' : 'Grand Tournament Gift'}
        </h2>
        <p className="text-xs text-amber-400 font-bold mb-4">
          {isAr ? 'عصا بلياردو أسطورية حصرية لبطل بطولة الكؤوس' : 'Exclusive legendary pool cue for tournament champion'}
        </p>

        {/* 1. Pending Unclaimed Tournament Gift View */}
        {giftData && !giftData.claimed && !isRevealed && (
          <div className="space-y-4 my-2">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/60 to-slate-950 border-2 border-amber-400/80 shadow-xl">
              <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-pulse inline-block mb-2">
                {isAr ? 'صندوق الهدية جاهز للفتح!' : 'Gift Chest Ready!'}
              </span>
              <p className="text-sm font-extrabold text-white mb-3">
                {isAr
                  ? 'مبروك فوزك ببطولة الكؤوس! انقر بالأسفل لفتح هديتك العشوائية:'
                  : 'Congratulations on winning the Tournament! Open your reward below:'}
              </p>

              <button
                onClick={handleOpenGift}
                disabled={isOpening}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Sparkles size={18} className={isOpening ? 'animate-spin' : 'animate-bounce'} />
                <span>
                  {isOpening
                    ? (isAr ? 'جاري فتح الصندوق...' : 'Opening Chest...')
                    : (isAr ? 'افتح هدية البطولة الآن 🎁' : 'Open Tournament Gift Now 🎁')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Revealed Prize View */}
        {isRevealed && awardedReward && (
          <div className="space-y-4 my-2 animate-fade-in">
            {awardedReward.type === 'cue' && awardedReward.cue ? (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/60 to-slate-950 border-2 border-purple-400/80 shadow-2xl">
                <span className="px-3 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                  {isAr ? 'عصا بلياردو حصرية جديدة!' : 'New Exclusive Cue Unlocked!'}
                </span>
                <div className="text-lg font-black text-white mt-1">
                  {isAr ? awardedReward.cue.arabicName : awardedReward.cue.name}
                </div>
                <div className="text-xs text-purple-300 font-bold capitalize mt-0.5 mb-3">
                  Tier: {awardedReward.cue.tier || 'Epic'}
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 text-left rtl:text-right space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Power:</span>
                    <span className="font-bold text-amber-400">{awardedReward.cue.power}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aim Line:</span>
                    <span className="font-bold text-sky-400">{awardedReward.cue.aimLength}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spin Control:</span>
                    <span className="font-bold text-emerald-400">{awardedReward.cue.spinControl}/5</span>
                  </div>
                </div>

                <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Check size={14} />
                  <span>{isAr ? 'تمت إضافة العصا لمتجرك وحسابك مجاناً!' : 'Equipped and added to your cues for free!'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/60 to-slate-950 border-2 border-amber-400/80 shadow-2xl">
                <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                  {isAr ? 'جائزة مالية نقدية كبرى!' : 'Grand Cash Prize!'}
                </span>
                <div className="text-3xl font-mono font-black text-amber-300 my-2 flex items-center justify-center gap-2">
                  <Banknote size={30} className="text-amber-400 animate-bounce" />
                  <span>+{awardedReward.coins?.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {isAr ? 'تم تحويل الجائزة المالية إلى رصيد عملاتك مباشرة!' : 'Cash prize added to your coin wallet!'}
                </p>
              </div>
            )}

            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl transition cursor-pointer"
            >
              {isAr ? 'رائع! حسناً' : 'Awesome! Collect'}
            </button>
          </div>
        )}

        {/* 3. No Tournament Win Yet (Instruction & Daily Preparation Bonus) */}
        {!giftData && !isRevealed && (
          <div className="space-y-4 my-2">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left rtl:text-right">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1.5">
                <Trophy size={16} />
                <span>{isAr ? 'كيف تحصل على هدية البطولة الكبرى؟' : 'How to win Tournament Gift?'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {isAr
                  ? 'فز ببطولة الكؤوس ضد 7 لاعبين عشوائيين (ربع النهائي، نصف النهائي، والنهائي الكبير) لتحصل على هدية البطولة العشوائية: عصا حصرية نادرة أو جائزة مالية حتى 2500 كوينز!'
                  : 'Win the 8-player Tournament Cup (3 rounds) to claim the Grand Tournament Gift: an exclusive pool cue or cash up to 2500 coins!'}
              </p>

              <button
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onOpenTournament();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>{isAr ? 'العب بطولة الكؤوس الآن' : 'Enter Tournament Cup Now'}</span>
              </button>
            </div>

            {/* Daily Practice Bonus */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between">
              <div className="text-left rtl:text-right">
                <div className="text-xs font-black text-white flex items-center gap-1">
                  <Gift size={14} className="text-emerald-400" />
                  <span>{isAr ? 'هدية تحفيزية للبطولة' : 'Tournament Practice Bonus'}</span>
                </div>
                <div className="text-[11px] text-emerald-300 font-bold mt-0.5">
                  +250 {isAr ? 'عملة مجانية' : 'Free Coins'}
                </div>
              </div>

              <button
                onClick={handleClaimDailyBonus}
                disabled={dailyBonusClaimed}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer"
              >
                {dailyBonusClaimed ? (isAr ? 'تم الاستلام' : 'Claimed') : (isAr ? 'استلام' : 'Claim')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
