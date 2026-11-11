/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw, LogOut, Play, X } from 'lucide-react';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onReplay: () => void;
  onExit: () => void;
  stakeAmount?: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onReplay,
  onExit,
  stakeAmount,
}) => {
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl p-6 text-center">
        {/* Close / Resume button in corner */}
        <button
          onClick={() => { sounds.playClick(); onResume(); }}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition active:scale-95 cursor-pointer"
          title={i18n.t('resumeMatch')}
        >
          <X size={18} />
        </button>

        {/* Top Header Badge / Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-400/40 flex items-center justify-center shadow-lg text-3xl">
            🎱
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1">
          {i18n.t('pauseTitle')}
        </h2>
        <p className="text-xs text-slate-400 mb-6 px-3">
          {i18n.t('pauseSubtitle')}
        </p>

        {/* Action Buttons: 1. Replay, 2. Exit */}
        <div className="flex flex-col gap-3">
          {/* Option 1: Replay Match (إعادة اللعب مجددا) */}
          <button
            onClick={() => {
              sounds.playClick();
              onReplay();
            }}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black shadow-[0_6px_20px_rgba(16,185,129,0.35)] border border-emerald-300/50 flex items-center justify-between transition-all duration-200 active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-left rtl:text-right">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 group-hover:rotate-180 transition-transform duration-500">
                <RotateCcw size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white">
                  {i18n.t('replayMatch')}
                </div>
                <div className="text-[11px] text-emerald-100 font-medium">
                  {i18n.t('replayMatchSubtitle')}
                </div>
              </div>
            </div>
            <span className="text-lg opacity-80 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              {isAr ? '←' : '→'}
            </span>
          </button>

          {/* Option 2: Exit Match (خيار الخروج / الاستسلام مع خسارة الرهان) */}
          <button
            onClick={() => {
              sounds.playClick();
              onExit();
            }}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black shadow-[0_6px_20px_rgba(225,29,72,0.3)] border border-rose-400/50 flex items-center justify-between transition-all duration-200 active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-left rtl:text-right">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5 transition-transform">
                <LogOut size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'انسحاب وخروج' : i18n.t('exitMatch')}
                </div>
                <div className="text-[11px] text-rose-200 font-bold">
                  {stakeAmount && stakeAmount > 0
                    ? (isAr ? `سلب مبلغ الرهان فقط (-${stakeAmount.toLocaleString()})` : `Forfeit staked wager only (-${stakeAmount.toLocaleString()})`)
                    : (isAr ? 'الخروج للقائمة الرئيسية' : i18n.t('exitMatchSubtitle'))}
                </div>
              </div>
            </div>
            <span className="text-lg opacity-80 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              {isAr ? '←' : '→'}
            </span>
          </button>

          {/* Resume Option */}
          <button
            onClick={() => {
              sounds.playClick();
              onResume();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95 cursor-pointer mt-1"
          >
            <Play size={14} fill="currentColor" />
            <span>{i18n.t('resumeMatch')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
