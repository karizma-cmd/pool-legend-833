/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, Banknote } from 'lucide-react';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface GameOverModalProps {
  isOpen: boolean;
  isVictory: boolean;
  winnerName: string;
  reason: string;
  coinsEarned: number;
  coinsLost?: number;
  xpEarned: number;
  onRematch: () => void;
  onMainMenu: () => void;
  tournamentStatus?: {
    isTournament: boolean;
    isChampion: boolean;
    nextRound?: number;
    hasGift?: boolean;
  };
  onOpenTournamentGift?: () => void;
  onNextTournamentMatch?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isVictory,
  winnerName,
  reason,
  coinsEarned,
  coinsLost = 0,
  xpEarned,
  onRematch,
  onMainMenu,
  tournamentStatus,
  onOpenTournamentGift,
  onNextTournamentMatch,
}) => {
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  useEffect(() => {
    if (isOpen && isVictory) {
      sounds.playVictory();
      try {
        confetti({
          particleCount: tournamentStatus?.isChampion ? 150 : 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [isOpen, isVictory, tournamentStatus]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/90 shadow-2xl p-6 text-center animate-fade-in">
        {/* Prominent Top Coin Deduction Alert */}
        {!isVictory && coinsLost > 0 && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-red-950/90 border border-red-500/70 text-red-200 text-xs font-black flex items-center justify-center gap-1.5 shadow-md">
            <span>🔻</span>
            <span>{isAr ? `تم خصم وسلب مبلغ الرهان: -${coinsLost.toLocaleString()} كوينز` : `Stake forfeited: -${coinsLost.toLocaleString()} Coins`}</span>
          </div>
        )}

        {/* Victory/Defeat Icon */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl border-2 ${
              tournamentStatus?.isChampion
                ? 'bg-gradient-to-br from-yellow-500/30 to-amber-600/30 text-yellow-300 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-bounce'
                : isVictory
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {tournamentStatus?.isChampion ? '👑' : isVictory ? '🏆' : '🎱'}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white tracking-wide mb-1">
          {tournamentStatus?.isChampion
            ? (isAr ? 'بطل الكؤوس الأسطوري!' : 'GRAND TOURNAMENT CHAMPION!')
            : isVictory
            ? i18n.t('victory')
            : i18n.t('defeat')}
        </h2>
        <p className="text-sm font-bold text-amber-400 mb-2">
          {winnerName} {isAr ? 'فاز بالمباراة!' : 'Wins the match!'}
        </p>
        <p className="text-xs text-slate-400 mb-5 px-2">
          {reason}
        </p>

        {/* Rewards / Losses Box */}
        {coinsEarned > 0 && (
          <div className="flex items-center justify-around p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-6 font-mono-numbers">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{i18n.t('coinsWon')}</div>
              <div className="text-base font-extrabold text-emerald-400 flex items-center gap-1.5 justify-center">
                <Banknote size={17} /> +{coinsEarned.toLocaleString()} {isAr ? 'كوينز' : 'Coins'}
              </div>
              <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                {tournamentStatus?.isChampion
                  ? (isAr ? '👑 جائزة بطل بطولة الكؤوس (5000 كوينز فقط)' : '👑 Grand Cup Champion Prize (5000 Coins only)')
                  : tournamentStatus?.isTournament && tournamentStatus.nextRound === 4
                  ? (isAr ? '🥉 مكافأة بلوغ نصف النهائي (2500 كوينز)' : '🥉 Semi-Finals Qualification Prize (2500 Coins)')
                  : (isAr ? '⚡ مضاعفة مبلغ الرهان مرة واحدة (2x)' : '⚡ 2x Wager Doubled Once')}
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">XP</div>
              <div className="text-base font-extrabold text-sky-400">
                +{xpEarned} XP
              </div>
            </div>
          </div>
        )}

        {/* Tournament win without coins (Rounds 1, 2, 4) */}
        {coinsEarned === 0 && isVictory && (
          <div className="flex items-center justify-around p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-6 font-mono-numbers">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isAr ? 'المكافأة' : 'Reward'}</div>
              <div className="text-sm font-extrabold text-sky-400 flex items-center gap-1.5 justify-center mt-0.5">
                <Trophy size={15} className="text-amber-400" /> {isAr ? 'تأهل للدور القادم' : 'Qualified for Next Round'}
              </div>
              <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                {isAr ? 'المكافآت المالية عند نصف النهائي (2500) والنهائي (5000 فقط)' : 'Coin prizes at Semi-Finals (2500) & Champion (5000 only)'}
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">XP</div>
              <div className="text-base font-extrabold text-sky-400">
                +{xpEarned} XP
              </div>
            </div>
          </div>
        )}

        {/* Regular Defeat: Lost only the staked wager */}
        {!isVictory && coinsLost > 0 && (
          <div className="flex items-center justify-around p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 mb-6 font-mono-numbers shadow-inner">
            <div>
              <div className="text-[10px] text-rose-300 uppercase tracking-wider font-bold">
                {isAr ? 'الرهان المفقود' : 'Lost Wager'}
              </div>
              <div className="text-base font-extrabold text-rose-400 flex items-center gap-1.5 justify-center">
                <Banknote size={17} className="text-rose-400" /> -{coinsLost.toLocaleString()} {isAr ? 'كوينز' : 'Coins'}
              </div>
              <div className="text-[9px] text-rose-300/80 font-bold mt-0.5">
                {isAr ? 'سلب مبلغ الرهان فقط' : 'Only staked wager forfeited'}
              </div>
            </div>
            <div className="w-[1px] h-8 bg-rose-800/40" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">XP</div>
              <div className="text-base font-extrabold text-sky-400">
                +{xpEarned} XP
              </div>
            </div>
          </div>
        )}

        {/* Tournament Defeat: Eliminated, no coins lost */}
        {!isVictory && coinsLost === 0 && (
          <div className="flex items-center justify-around p-3 rounded-2xl bg-slate-950/70 border border-slate-800 mb-6 font-mono-numbers">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{isAr ? 'النتيجة' : 'Result'}</div>
              <div className="text-sm font-extrabold text-rose-400 flex items-center gap-1.5 justify-center mt-0.5">
                🎱 {isAr ? 'إقصاء من بطولة الكؤوس' : 'Tournament Elimination'}
              </div>
              <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                {isAr ? 'لم يتم سلب أي كوينز من رصيدك' : 'Zero coins deducted from wallet'}
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">XP</div>
              <div className="text-base font-extrabold text-sky-400">
                +{xpEarned} XP
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          {/* Tournament Champion Prize Claim Action */}
          {tournamentStatus?.isChampion && onOpenTournamentGift && (
            <button
              onClick={() => { sounds.playClick(); onOpenTournamentGift(); }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer animate-pulse"
            >
              <span>🎁 {isAr ? 'استلام هدية البطولة الآن' : 'Claim Tournament Gift Now'}</span>
            </button>
          )}

          {/* Next Tournament Match Action */}
          {tournamentStatus?.isTournament && !tournamentStatus.isChampion && isVictory && onNextTournamentMatch && (
            <button
              onClick={() => { sounds.playClick(); onNextTournamentMatch(); }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <span>🏆 {isAr ? 'المباراة التالية في البطولة' : 'Next Tournament Match'}</span>
            </button>
          )}

          {(!tournamentStatus?.isTournament || !isVictory) && (
            <button
              onClick={() => { sounds.playClick(); onRematch(); }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw size={16} /> {i18n.t('rematch')}
            </button>
          )}

          <button
            onClick={() => { sounds.playClick(); onMainMenu(); }}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Home size={16} /> {i18n.t('mainMenu')}
          </button>
        </div>
      </div>
    </div>
  );
};
